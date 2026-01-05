import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { resolveDagContext } from "../../dag-run";
import { updateComputedMetricsOnMetricsIngest, updateDagRunMetricSnapshot } from "../../dag-metrics";
import type { IngestMetricsParams, IngestMetricsResult } from "./types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("MetricsIngest");

/**
 * Ingests a metrics payload into the database.
 * All metrics are stored as a flexible JSON blob - any 1D key-value pairs are accepted.
 * The capture_id is generated server-side to ensure uniqueness.
 */
export async function ingestMetrics(
  params: IngestMetricsParams
): Promise<IngestMetricsResult> {
  const { organizationId, environment, payload } = params;
  const capturedAt = new Date(payload.captured_at);
  const captureId = randomUUID();

  logger.debug(
    { organizationId, dagId: payload.dag_id, taskId: payload.task_id, captureId },
    "Ingesting metrics"
  );

  const taskRunId = await resolveDagContext({
    organizationId,
    environment,
    srcDagId: payload.dag_id,
    srcTaskId: payload.task_id,
    srcRunId: payload.run_id,
    namespace: "airflow",
    timestamp: capturedAt,
  });

  await createMetric({
    organizationId,
    captureId,
    taskRunId,
    metrics: payload.metrics ?? {},
    schema: payload.schema ?? null,
    capturedAt,
  });

  // Update computed metrics aggregations
  const taskRun = await prisma.taskRun.findUnique({
    where: { id: taskRunId },
    select: {
      dagRunId: true,
      dagRun: {
        select: { srcDagId: true, startTime: true },
      },
    },
  });

  if (taskRun?.dagRun) {
    // Extract row_count from metrics if present (for backwards compatibility with computed metrics)
    const rowCount = typeof payload.metrics?.row_count === "number" 
      ? BigInt(payload.metrics.row_count) 
      : BigInt(0);

    await updateComputedMetricsOnMetricsIngest({
      organizationId,
      dagId: taskRun.dagRun.srcDagId,
      environment: environment ?? null,
      rowCount,
      startTime: taskRun.dagRun.startTime,
    });

    // Update the per-run metric snapshot
    await updateDagRunMetricSnapshot({
      organizationId,
      dagRunId: taskRun.dagRunId,
    });
  }

  return { taskRunId };
}

async function createMetric(params: {
  organizationId: string;
  captureId: string;
  taskRunId: string;
  metrics: Record<string, unknown>;
  schema: Record<string, unknown> | null;
  capturedAt: Date;
}): Promise<void> {
  const { organizationId, captureId, taskRunId, metrics, schema, capturedAt } = params;

  await prisma.metric.create({
    data: {
      organizationId,
      captureId,
      taskRunId,
      metrics: metrics as Prisma.InputJsonValue,
      schema: schema as Prisma.InputJsonValue,
      capturedAt,
    },
  });
}
