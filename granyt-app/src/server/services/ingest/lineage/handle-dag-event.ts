import { prisma } from "@/lib/prisma";
import { DagRunStatus } from "@prisma/client";
import { ensureDagExists } from "../../dag-run";
import { updateComputedMetricsOnRunComplete, updateDagRunMetricSnapshot } from "../../dag-metrics";
import { scheduleAlertEvaluation } from "../../alerts";
import { inferRunType, calculateDuration } from "./helpers";
import type { DagLevelEventParams } from "./types";

/**
 * Handles DAG-level lineage events.
 */
export async function handleDagLevelEvent(
  params: DagLevelEventParams
): Promise<void> {
  const {
    organizationId,
    environment,
    srcDagId,
    namespace,
    srcRunId,
    eventType,
    eventTime,
    schedule,
  } = params;

  await ensureDagExists({
    organizationId,
    srcDagId,
    namespace,
    timestamp: eventTime,
    schedule,
  });

  await upsertDagRun({
    organizationId,
    srcDagId,
    namespace,
    srcRunId,
    eventType,
    eventTime,
    environment,
  });
}

async function upsertDagRun(params: {
  organizationId: string;
  srcDagId: string;
  namespace: string;
  srcRunId: string;
  eventType: string;
  eventTime: Date;
  environment?: string | null;
}): Promise<void> {
  const { organizationId, srcDagId, namespace, srcRunId, eventType, eventTime, environment } = params;

  const whereClause = {
    organizationId_srcDagId_srcRunId_environment: {
      organizationId,
      srcDagId,
      srcRunId,
      environment: environment ?? null,
    },
  };

  const baseData = {
    organizationId,
    srcDagId,
    namespace,
    srcRunId,
    runType: inferRunType(srcRunId),
    environment,
  };

  if (eventType === "START") {
    await prisma.dagRun.upsert({
      where: whereClause,
      create: { ...baseData, startTime: eventTime, status: DagRunStatus.RUNNING },
      update: {
        startTime: eventTime,
        status: DagRunStatus.RUNNING,
        // Update namespace if it was "airflow" and we have a better one
        ...(namespace !== "airflow" && { namespace }),
      },
    });
    return;
  }

  if (eventType === "COMPLETE") {
    const existing = await prisma.dagRun.findUnique({
      where: whereClause,
      select: { id: true, startTime: true },
    });
    const duration = calculateDuration(existing?.startTime ?? null, eventTime);

    const dagRun = await prisma.dagRun.upsert({
      where: whereClause,
      create: { ...baseData, startTime: eventTime, endTime: eventTime, status: DagRunStatus.SUCCESS },
      update: {
        endTime: eventTime,
        duration,
        status: DagRunStatus.SUCCESS,
        // Update namespace if it was "airflow" and we have a better one
        ...(namespace !== "airflow" && { namespace }),
      },
    });

    // Update computed metrics
    await updateComputedMetricsOnRunComplete({
      organizationId,
      dagId: srcDagId,
      environment: environment ?? null,
      runStatus: "success",
      runDuration: duration,
      customMetrics: null, // Custom metrics now come from DataMetric
      startTime: existing?.startTime ?? eventTime,
    });

    // Update the per-run metric snapshot
    await updateDagRunMetricSnapshot({
      organizationId,
      dagRunId: dagRun.id,
    });

    // Schedule alert evaluation after 1 minute to ensure all metrics are captured
    await scheduleAlertEvaluation(organizationId, dagRun.id);
    return;
  }

  if (eventType === "FAIL" || eventType === "ABORT") {
    const existing = await prisma.dagRun.findUnique({
      where: whereClause,
      select: { id: true, startTime: true },
    });
    const duration = calculateDuration(existing?.startTime ?? null, eventTime);

    const dagRun = await prisma.dagRun.upsert({
      where: whereClause,
      create: { ...baseData, startTime: eventTime, endTime: eventTime, status: DagRunStatus.FAILED },
      update: { endTime: eventTime, duration, status: DagRunStatus.FAILED },
    });

    // Update computed metrics
    await updateComputedMetricsOnRunComplete({
      organizationId,
      dagId: srcDagId,
      environment: environment ?? null,
      runStatus: "failed",
      runDuration: duration,
      customMetrics: null, // Custom metrics now come from DataMetric
      startTime: existing?.startTime ?? eventTime,
    });

    // Update the per-run metric snapshot
    await updateDagRunMetricSnapshot({
      organizationId,
      dagRunId: dagRun.id,
    });

    // Schedule alert evaluation after 1 minute to ensure all metrics are captured
    await scheduleAlertEvaluation(organizationId, dagRun.id);
  }
}
