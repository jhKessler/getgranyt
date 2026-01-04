import { prisma } from "@/lib/prisma";
import { parseMetricsJson, getNumericMetric } from "@/lib/json-schemas";
import { AlertStatus } from "@prisma/client";
import { Timeframe } from "../dashboard/types";
import { getDisplayStatus, DisplayStatus } from "../status-utils";
import type {
  ComputedMetricsData,
  CustomMetricAggregation,
  GetComputedMetricsParams,
} from "./types";
import { parseCustomMetrics, serializeCustomMetrics } from "./schemas";

const ALL_TIMEFRAMES = [Timeframe.Day, Timeframe.Week, Timeframe.Month];

// Helper to get timeframe cutoff date
function getTimeframeCutoff(timeframe: Timeframe): Date | null {
  const now = new Date();
  switch (timeframe) {
    case Timeframe.Day:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case Timeframe.Week:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case Timeframe.Month:
      return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    case Timeframe.AllTime:
      return null;
  }
}

// Check if a date falls within a timeframe
function isWithinTimeframe(date: Date, timeframe: Timeframe): boolean {
  const cutoff = getTimeframeCutoff(timeframe);
  if (cutoff === null) return true;
  return date >= cutoff;
}

// Merge custom metrics aggregations
function mergeCustomMetrics(
  existing: Record<string, CustomMetricAggregation> | null,
  newMetrics: Record<string, unknown> | null
): Record<string, CustomMetricAggregation> | null {
  if (!newMetrics) return existing;

  const result = existing ? { ...existing } : {};

  for (const [key, value] of Object.entries(newMetrics)) {
    // Only aggregate numeric metrics
    if (typeof value !== "number") continue;

    if (result[key]) {
      result[key] = {
        sum: result[key].sum + value,
        count: result[key].count + 1,
        lastValue: value,
      };
    } else {
      result[key] = { sum: value, count: 1, lastValue: value };
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

interface UpdateOnRunCompleteParams {
  organizationId: string;
  dagId: string;
  environment: string | null;
  runStatus: "success" | "failed" | "running";
  runDuration: number | null;
  customMetrics?: Record<string, unknown> | null;
  startTime: Date;
}

/**
 * Update computed metrics when a DAG run completes.
 * Increments run counts and updates custom metrics.
 */
export async function updateComputedMetricsOnRunComplete(
  params: UpdateOnRunCompleteParams
): Promise<void> {
  const {
    organizationId,
    dagId,
    environment,
    runStatus,
    runDuration,
    customMetrics,
    startTime,
  } = params;

  // Only count completed runs
  if (runStatus === "running") return;

  const isSuccess = runStatus === "success";
  const customMetricsAgg = customMetrics
    ? Object.fromEntries(
        Object.entries(customMetrics)
          .filter(([_, v]) => typeof v === "number")
          .map(([k, v]) => [k, { sum: v as number, count: 1, lastValue: v as number }])
      )
    : null;

  // Update metrics for all applicable timeframes
  for (const timeframe of ALL_TIMEFRAMES) {
    if (!isWithinTimeframe(startTime, timeframe)) continue;

    const envValue = environment ?? "";

    await prisma.dagComputedMetrics.upsert({
      where: {
        organizationId_dagId_environment_timeframe: {
          organizationId,
          dagId,
          environment: envValue,
          timeframe,
        },
      },
      create: {
        organizationId,
        dagId,
        environment: envValue,
        timeframe,
        totalRuns: 1,
        successfulRuns: isSuccess ? 1 : 0,
        failedRuns: isSuccess ? 0 : 1,
        totalRows: BigInt(0),
        totalDuration: BigInt(runDuration ?? 0),
        customMetrics: customMetricsAgg ?? undefined,
        lastComputedAt: new Date(),
      },
      update: {
        totalRuns: { increment: 1 },
        successfulRuns: isSuccess ? { increment: 1 } : undefined,
        failedRuns: isSuccess ? undefined : { increment: 1 },
        totalDuration: { increment: runDuration ?? 0 },
        lastComputedAt: new Date(),
        // Custom metrics need to be merged manually
      },
    });

    // If we have custom metrics, merge them (separate query for complex merge)
    if (customMetrics) {
      const existing = await prisma.dagComputedMetrics.findUnique({
        where: {
          organizationId_dagId_environment_timeframe: {
            organizationId,
            dagId,
            environment: envValue,
            timeframe,
          },
        },
        select: { customMetrics: true },
      });

      const merged = mergeCustomMetrics(
        parseCustomMetrics(existing?.customMetrics),
        customMetrics
      );

      await prisma.dagComputedMetrics.update({
        where: {
          organizationId_dagId_environment_timeframe: {
            organizationId,
            dagId,
            environment: envValue,
            timeframe,
          },
        },
        data: merged ? { customMetrics: serializeCustomMetrics(merged) } : {},
      });
    }
  }
}

interface UpdateOnMetricsIngestParams {
  organizationId: string;
  dagId: string;
  environment: string | null;
  rowCount: number | bigint;
  startTime: Date;
}

/**
 * Update computed metrics when metrics are ingested.
 * Updates row counts.
 */
export async function updateComputedMetricsOnMetricsIngest(
  params: UpdateOnMetricsIngestParams
): Promise<void> {
  const { organizationId, dagId, environment, rowCount, startTime } =
    params;

  const envValue = environment ?? "";

  for (const timeframe of ALL_TIMEFRAMES) {
    if (!isWithinTimeframe(startTime, timeframe)) continue;

    await prisma.dagComputedMetrics.upsert({
      where: {
        organizationId_dagId_environment_timeframe: {
          organizationId,
          dagId,
          environment: envValue,
          timeframe,
        },
      },
      create: {
        organizationId,
        dagId,
        environment: envValue,
        timeframe,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        totalRows: BigInt(rowCount),
        totalDuration: BigInt(0),
        lastComputedAt: new Date(),
      },
      update: {
        totalRows: { increment: rowCount },
        lastComputedAt: new Date(),
      },
    });
  }
}

/**
 * Get computed metrics for a DAG.
 */
export async function getComputedMetrics(
  params: GetComputedMetricsParams
): Promise<ComputedMetricsData | null> {
  const { organizationId, dagId, environment, timeframe } = params;

  // Note: Using findFirst because Prisma's findUnique doesn't support null in compound keys
  const metrics = await prisma.dagComputedMetrics.findFirst({
    where: {
      organizationId,
      dagId,
      environment: environment ?? null,
      timeframe,
    },
  });

  if (!metrics) return null;

  const totalRuns = metrics.totalRuns;
  const successRate = totalRuns > 0 ? (metrics.successfulRuns / totalRuns) * 100 : 0;
  const avgDuration =
    totalRuns > 0 ? Number(metrics.totalDuration) / totalRuns : null;
  const avgRows = totalRuns > 0 ? Number(metrics.totalRows) / totalRuns : null;

  return {
    totalRuns: metrics.totalRuns,
    successfulRuns: metrics.successfulRuns,
    failedRuns: metrics.failedRuns,
    successRate,
    totalRows: Number(metrics.totalRows), // Convert BigInt to number for JSON serialization
    avgRows,
    totalDuration: Number(metrics.totalDuration), // Convert BigInt to number for JSON serialization
    avgDuration,
    customMetrics: parseCustomMetrics(metrics.customMetrics),
  };
}

interface RecalculateParams {
  organizationId: string;
  dagId: string;
  environment?: string | null;
}

/**
 * Recalculate all computed metrics from scratch.
 * Used for initial seeding or data recovery.
 */
export async function recalculateComputedMetrics(
  params: RecalculateParams
): Promise<void> {
  const { organizationId, dagId, environment } = params;

  // Delete existing computed metrics
  await prisma.dagComputedMetrics.deleteMany({
    where: {
      organizationId,
      dagId,
      environment: environment ?? undefined,
    },
  });

  // Recalculate for each timeframe
  for (const timeframe of ALL_TIMEFRAMES) {
    const cutoff = getTimeframeCutoff(timeframe);

    // Get all runs within timeframe
    const runs = await prisma.dagRun.findMany({
      where: {
        organizationId,
        srcDagId: dagId,
        environment: environment ?? undefined,
        ...(cutoff && { startTime: { gte: cutoff } }),
      },
      select: {
        id: true,
        status: true,
        _count: { select: { alerts: { where: { status: AlertStatus.OPEN } } } },
        duration: true,
      },
    });

    if (runs.length === 0) continue;

    // Aggregate run metrics
    let totalRuns = 0;
    let successfulRuns = 0;
    let failedRuns = 0;
    let totalDuration = BigInt(0);
    let totalRows = BigInt(0);
    let customMetricsAgg: Record<string, CustomMetricAggregation> | null = null;

    for (const run of runs) {
      totalRuns++;
      const displayStatus = getDisplayStatus(run.status, run._count.alerts);
      if (displayStatus === DisplayStatus.SUCCESS || displayStatus === DisplayStatus.WARNING) successfulRuns++;
      else if (displayStatus === DisplayStatus.FAILED) failedRuns++;
      totalDuration += BigInt(run.duration ?? 0);

      // Get metrics from Metric model for this run
      const metrics = await prisma.metric.findMany({
        where: {
          organizationId,
          taskRun: { dagRunId: run.id },
        },
        select: { metrics: true },
      });

      for (const metric of metrics) {
        const metricsData = parseMetricsJson(metric.metrics);
        
        // Sum row counts
        const rowCount = getNumericMetric(metricsData, "row_count");
        if (rowCount !== null) {
          totalRows += BigInt(Math.floor(rowCount));
        }

        // Extract custom metrics (any numeric field that's not a standard field)
        const standardFields = new Set(["row_count", "column_count", "memory_bytes", "dataframe_type", "columns", "upstream"]);
        const customMetrics: Record<string, number> = {};
        for (const [key, val] of Object.entries(metricsData)) {
          if (!standardFields.has(key) && typeof val === "number") {
            customMetrics[key] = val;
          }
        }
        
        if (Object.keys(customMetrics).length > 0) {
          customMetricsAgg = mergeCustomMetrics(customMetricsAgg, customMetrics);
        }
      }
    }

    // Create the computed metrics record
    await prisma.dagComputedMetrics.upsert({
      where: {
        organizationId_dagId_environment_timeframe: {
          organizationId,
          dagId,
          environment: environment ?? "",
          timeframe,
        },
      },
      create: {
        organizationId,
        dagId,
        environment: environment ?? "",
        timeframe,
        totalRuns,
        successfulRuns,
        failedRuns,
        totalRows,
        totalDuration,
        ...(customMetricsAgg ? { customMetrics: serializeCustomMetrics(customMetricsAgg) } : {}),
        lastComputedAt: new Date(),
      },
      update: {
        totalRuns,
        successfulRuns,
        failedRuns,
        totalRows,
        totalDuration,
        ...(customMetricsAgg ? { customMetrics: serializeCustomMetrics(customMetricsAgg) } : {}),
        lastComputedAt: new Date(),
      },
    });
  }
}
