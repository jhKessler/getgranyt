/**
 * Historical Data Fetcher Module
 *
 * Fetches and enriches historical run data for cohort-based analysis.
 * Optimized for performance with selective field fetching and batched queries.
 */

import { prisma } from "@/lib/prisma";
import { getNumericMetric } from "@/lib/json-schemas";
import { HistoricalRun } from "./cohort-stats";
import type { Prisma } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

interface FetchOptions {
  /** Maximum number of historical runs to fetch */
  limit?: number;
  /** Include the current run in results (default: false) */
  includeCurrent?: boolean;
}

interface RawHistoricalData {
  metrics: Prisma.JsonValue;
  capturedAt: Date;
  taskRun: {
    dagRun: {
      runType: string | null;
      startTime: Date;
    };
  } | null;
}

// ============================================================================
// Data Fetching
// ============================================================================

/**
 * Fetch historical runs for a capture point with temporal enrichment
 *
 * Performance optimizations:
 * - Selective field fetching (only what we need)
 * - Single query with joins instead of N+1
 * - Index-friendly ordering
 */
export async function fetchHistoricalRuns(
  organizationId: string,
  captureId: string,
  options: FetchOptions = {}
): Promise<HistoricalRun[]> {
  const { limit = 60, includeCurrent = false } = options;

  const rawData = await prisma.metric.findMany({
    where: {
      organizationId,
      captureId,
    },
    select: {
      metrics: true,
      capturedAt: true,
      taskRun: {
        select: {
          dagRun: {
            select: {
              runType: true,
              startTime: true,
            },
          },
        },
      },
    },
    orderBy: {
      capturedAt: "desc",
    },
    skip: includeCurrent ? 0 : 1, // Skip current run unless requested
    take: limit,
  });

  return enrichWithTemporalData(rawData);
}

/**
 * Enrich raw data with temporal fields for cohort analysis
 */
function enrichWithTemporalData(rawData: RawHistoricalData[]): HistoricalRun[] {
  return rawData.map((row) => {
    // Use dagRun startTime if available, otherwise fall back to capturedAt
    const referenceTime = row.taskRun?.dagRun?.startTime ?? row.capturedAt;
    // Extract row_count from the metrics JSON
    const metricsObj = typeof row.metrics === "object" && row.metrics !== null 
      ? row.metrics as Record<string, unknown>
      : {};
    const rowCount = getNumericMetric(metricsObj, "row_count") ?? 0;

    return {
      rowCount,
      capturedAt: row.capturedAt,
      runType: row.taskRun?.dagRun?.runType ?? null,
      dayOfWeek: referenceTime.getUTCDay(),
      hourOfDay: referenceTime.getUTCHours(),
    };
  });
}

// ============================================================================
// Context Building
// ============================================================================

/**
 * Get current run's temporal context
 */
export function getCurrentRunContext(startTime: Date): {
  dayOfWeek: number;
  hourOfDay: number;
  isWeekend: boolean;
} {
  const dayOfWeek = startTime.getUTCDay();
  return {
    dayOfWeek,
    hourOfDay: startTime.getUTCHours(),
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
  };
}

/**
 * Fetch the current run's start time from DagRun
 */
export async function fetchCurrentRunStartTime(
  organizationId: string,
  dagRunId: string
): Promise<Date | null> {
  const dagRun = await prisma.dagRun.findUnique({
    where: { id: dagRunId },
    select: { startTime: true, runType: true },
  });

  return dagRun?.startTime ?? null;
}

/**
 * Fetch current run metadata (start time + run type)
 */
export async function fetchCurrentRunMetadata(
  dagRunId: string
): Promise<{ startTime: Date; runType: string | null } | null> {
  const dagRun = await prisma.dagRun.findUnique({
    where: { id: dagRunId },
    select: { startTime: true, runType: true },
  });

  if (!dagRun) return null;

  return {
    startTime: dagRun.startTime,
    runType: dagRun.runType,
  };
}
