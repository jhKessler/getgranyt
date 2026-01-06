import { prisma } from "@/lib/prisma";
import { Alert, DagRunStatus } from "@prisma/client";
import { 
  getNumericMetric, 
  parseMetricsJson,
  parseColumnsFromSchema 
} from "@/lib/json-schemas";
import { detectorRegistry } from "../detectors";
import { getEffectiveSettings } from "./get-effective-settings";
import {
  DetectorContext,
  CreateAlertInput,
  AlertType,
  AlertStatus,
} from "../types";
import { notify, NotificationEventType, type BatchAlertItem } from "../../notifications";
import { createLogger } from "@/lib/logger";
import { env } from "@/env";

const logger = createLogger("AlertEngine");

/**
 * Processes alert evaluation for a given job ID.
 * This is called after the scheduled delay.
 */
export async function processAlertEvaluation(jobId: string): Promise<Alert[]> {
  // 1. Get and lock the job
  const job = await prisma.alertEvaluationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    logger.warn({ jobId }, "Job not found");
    return [];
  }

  // Skip if already processed or still too early
  if (job.status !== "pending") {
    return [];
  }

  // Check if we should wait longer (in case scheduledFor was pushed back)
  if (job.scheduledFor > new Date()) {
    // Reschedule for the new time
    const remainingDelay = job.scheduledFor.getTime() - Date.now();
    if (remainingDelay > 0) {
      setTimeout(() => {
        processAlertEvaluation(jobId).catch(console.error);
      }, remainingDelay);
      return [];
    }
  }

  // 2. Mark as processing
  try {
    await prisma.alertEvaluationJob.update({
      where: { id: jobId, status: "pending" },
      data: { status: "processing", attempts: { increment: 1 } },
    });
  } catch {
    // Another process might have picked it up
    return [];
  }

  // 3. Process the evaluation
  try {
    const alerts = await runAlertDetection(job.dagRunId);

    // 4. Mark as completed
    await prisma.alertEvaluationJob.update({
      where: { id: jobId },
      data: { status: "completed", processedAt: new Date() },
    });

    if (alerts.length > 0) {
      logger.info(
        { count: alerts.length, dagRunId: job.dagRunId },
        "Created alerts for DAG run"
      );
    }

    return alerts;
  } catch (error) {
    // 5. Handle failure
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await prisma.alertEvaluationJob.update({
      where: { id: jobId },
      data: {
        status: job.attempts >= 2 ? "failed" : "pending", // Retry up to 3 times
        lastError: errorMessage,
      },
    });

    logger.error(
      { jobId, error: errorMessage },
      "Failed to process job"
    );
    return [];
  }
}

/**
 * Internal function that runs alert detection for a DAG run.
 * Fetches all data from the database and runs all detectors.
 */
async function runAlertDetection(dagRunId: string): Promise<Alert[]> {
  const createdAlerts: Alert[] = [];

  // 1. Get the DAG run with all related data
  const dagRun = await prisma.dagRun.findUnique({
    where: { id: dagRunId },
    include: {
      taskRuns: {
        include: {
          metrics: true,
        },
      },
    },
  });

  if (!dagRun) {
    logger.warn({ dagRunId }, "DAG run not found");
    return [];
  }

  // 2. Only evaluate completed runs (success or failed)
  const currentStatus = dagRun.status;
  if (currentStatus !== DagRunStatus.SUCCESS && currentStatus !== DagRunStatus.FAILED) {
    return []; // Still running, skip
  }

  // 3. Evaluate each task's metrics
  for (const taskRun of dagRun.taskRuns) {
    for (const metric of taskRun.metrics) {
      const metricsData = parseMetricsJson(metric.metrics);
      
      // Get columns from the schema column
      const columns = parseColumnsFromSchema(metric.schema);

      const ctx: DetectorContext = {
        organizationId: dagRun.organizationId,
        srcDagId: dagRun.srcDagId,
        captureId: metric.captureId,
        dagRunId: dagRun.id,
        taskRunId: taskRun.id,
        environment: dagRun.environment,
        // Data from metric JSON
        rowCount: getNumericMetric(metricsData, "row_count") ?? null,
        columnCount: getNumericMetric(metricsData, "column_count") ?? null,
        columns,
        memoryBytes: getNumericMetric(metricsData, "memory_bytes") ?? null,
      };

      const alerts = await evaluateDetectors(ctx);
      createdAlerts.push(...alerts);
    }
  }

  // Map DagRunStatus to string for detector context
  const statusString = currentStatus === DagRunStatus.SUCCESS ? "success" : "failed";

  // 4. Run DAG-level detectors (future: duration anomaly, etc.)
  const dagCtx: DetectorContext = {
    organizationId: dagRun.organizationId,
    srcDagId: dagRun.srcDagId,
    captureId: null,
    dagRunId: dagRun.id,
    taskRunId: null,
    environment: dagRun.environment,
    dagDuration: dagRun.duration,
    dagStatus: statusString,
  };

  const dagAlerts = await evaluateDetectors(dagCtx);
  createdAlerts.push(...dagAlerts);

  // Note: No need to update status to WARNING anymore!
  // The display status is now computed dynamically based on open alerts count.
  // When alerts are created, querying the dagRun with _count of open alerts
  // will automatically show WARNING for successful runs with alerts.

  // 5. Send a single batch notification if any alerts were created
  if (createdAlerts.length > 0) {
    await sendBatchAlertNotification(dagRun, createdAlerts);
  }

  return createdAlerts;
}

/**
 * Sends a single notification summarizing all alerts from a DAG run
 */
async function sendBatchAlertNotification(
  dagRun: { id: string; organizationId: string; srcDagId: string; srcRunId: string; environment: string | null },
  alerts: Alert[]
): Promise<void> {
  // Convert alerts to batch alert items
  const batchAlerts: BatchAlertItem[] = alerts.map(alert => ({
    alertId: alert.id,
    alertType: alert.alertType as "ROW_COUNT_DROP" | "NULL_OCCURRENCE" | "SCHEMA_CHANGE",
    severity: alert.severity as "info" | "warning" | "critical",
    captureId: alert.captureId,
    metadata: alert.metadata as Record<string, unknown>,
  }));

  // Determine overall severity (use highest severity from all alerts)
  const hasCritical = alerts.some(a => a.severity === "critical");
  const overallSeverity = hasCritical ? "critical" : "warning";

  // Build dashboard URL pointing to the run detail page
  const dashboardUrl = env.NEXT_PUBLIC_APP_URL 
    ? `${env.NEXT_PUBLIC_APP_URL}/dashboard/dags/${encodeURIComponent(dagRun.srcDagId)}/runs/${encodeURIComponent(dagRun.id)}`
    : undefined;

  // Send the batch notification
  notify({
    organizationId: dagRun.organizationId,
    type: NotificationEventType.DAG_RUN_ALERTS_SUMMARY,
    severity: overallSeverity,
    dagId: dagRun.srcDagId,
    dagRunId: dagRun.id,
    srcRunId: dagRun.srcRunId,
    environment: dagRun.environment,
    alerts: batchAlerts,
    dashboardUrl,
  }).catch((err) => {
    logger.error(
      { error: err, organizationId: dagRun.organizationId, dagRunId: dagRun.id },
      "Failed to send batch alert notification"
    );
  });
}

/**
 * Runs all registered detectors against the given context
 */
async function evaluateDetectors(ctx: DetectorContext): Promise<Alert[]> {
  const createdAlerts: Alert[] = [];

  for (const [alertType, detector] of detectorRegistry) {
    // Get effective settings for this context
    const settings = await getEffectiveSettings(
      ctx.organizationId,
      ctx.srcDagId,
      ctx.captureId,
      alertType
    );

    // Skip if disabled
    if (!settings.enabled) {
      continue;
    }

    // Check for existing open alert to avoid duplicates
    const existingAlert = await findOpenAlert(
      ctx.organizationId,
      ctx.srcDagId,
      ctx.captureId,
      alertType
    );

    if (existingAlert) {
      continue; // Don't create duplicate alerts
    }

    // Run the detector
    const result = await detector.detect(ctx, settings);

    if (result?.shouldAlert) {
      const alert = await createAlert({
        organizationId: ctx.organizationId,
        alertType,
        severity: result.severity,
        srcDagId: ctx.srcDagId,
        captureId: ctx.captureId,
        dagRunId: ctx.dagRunId,
        taskRunId: ctx.taskRunId,
        metadata: result.metadata,
      });

      createdAlerts.push(alert);
    }
  }

  return createdAlerts;
}

/**
 * Finds an existing open alert for the same context
 */
async function findOpenAlert(
  organizationId: string,
  srcDagId: string,
  captureId: string | null,
  alertType: AlertType
): Promise<Alert | null> {
  return prisma.alert.findFirst({
    where: {
      organizationId,
      srcDagId,
      captureId: captureId ?? undefined,
      alertType,
      status: AlertStatus.OPEN,
    },
  });
}

/**
 * Creates a new alert in the database.
 * Note: Notifications are sent in batch after all alerts are created for a DAG run.
 */
async function createAlert(input: CreateAlertInput): Promise<Alert> {
  const alert = await prisma.alert.create({
    data: {
      organizationId: input.organizationId,
      alertType: input.alertType,
      status: AlertStatus.OPEN,
      severity: input.severity,
      srcDagId: input.srcDagId ?? "system",
      captureId: input.captureId,
      dagRunId: input.dagRunId,
      taskRunId: input.taskRunId,
      metadata: input.metadata as object,
    },
  });

  return alert;
}
