import { prisma } from "@/lib/prisma";
import { parseColumnsFromSchema } from "@/lib/json-schemas";
import {
  AlertDetector,
  DetectorContext,
  DetectionResult,
  EffectiveAlertSettings,
  AlertType,
  ColumnInfo,
} from "../types";

/**
 * Minimum number of historical occurrences required before we can detect anomalies.
 * We use max(last 7 days, last 4 occurrences).
 */
const MIN_OCCURRENCES = 4;

/**
 * Number of days to look back for historical data
 */
const LOOKBACK_DAYS = 7;

/**
 * Fetches historical column metrics for a specific capture point.
 * Returns metrics from the last 7 days or last 4 occurrences, whichever is larger.
 */
async function getHistoricalColumnMetrics(
  organizationId: string,
  captureId: string
): Promise<ColumnInfo[][]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - LOOKBACK_DAYS);

  // First, get metrics from the last 7 days
  const recentMetrics = await prisma.metric.findMany({
    where: {
      organizationId,
      captureId,
      capturedAt: { gte: sevenDaysAgo },
    },
    select: {
      metrics: true,
      schema: true,
      capturedAt: true,
    },
    orderBy: {
      capturedAt: "desc",
    },
    skip: 1, // Skip the current (most recent) metric
  });

  // If we have fewer than MIN_OCCURRENCES, fetch more by count
  if (recentMetrics.length < MIN_OCCURRENCES) {
    const additionalMetrics = await prisma.metric.findMany({
      where: {
        organizationId,
        captureId,
      },
      select: {
        metrics: true,
        schema: true,
        capturedAt: true,
      },
      orderBy: {
        capturedAt: "desc",
      },
      skip: 1, // Skip the current (most recent) metric
      take: MIN_OCCURRENCES,
    });

    // Use the larger set
    if (additionalMetrics.length > recentMetrics.length) {
      return additionalMetrics.map((m) => parseColumnsFromSchema(m.schema));
    }
  }

  return recentMetrics.map((m) => parseColumnsFromSchema(m.schema));
}

/**
 * Checks if a column has ever had nulls in historical data
 */
function hasHistoricalNulls(columnName: string, history: ColumnInfo[][]): boolean {
  for (const columns of history) {
    if (!columns) continue;
    const column = columns.find((c) => c.name === columnName);
    if (column && column.null_count !== null && column.null_count > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a column existed in historical data (i.e., it's not a new column)
 */
function existedInHistory(columnName: string, history: ColumnInfo[][]): boolean {
  for (const columns of history) {
    if (!columns) continue;
    if (columns.some((c) => c.name === columnName)) {
      return true;
    }
  }
  return false;
}

/**
 * Null Occurrence Detector
 *
 * Detects when a column that has historically never had null values
 * suddenly has null values. This indicates a potential data quality issue.
 *
 * The detector compares the current metric against:
 * - All metrics from the last 7 days, OR
 * - The last 4 occurrences
 * (whichever set is larger)
 *
 * An alert is triggered if:
 * - The current column has null_count > 0
 * - No historical occurrence of this column has null_count > 0
 * - The column existed in at least one historical occurrence (not a new column)
 */
export const nullOccurrenceDetector: AlertDetector = {
  type: AlertType.NULL_OCCURRENCE,

  async detect(
    ctx: DetectorContext,
    settings: EffectiveAlertSettings
  ): Promise<DetectionResult | null> {
    // Skip if no column data or disabled
    if (!ctx.columns || ctx.columns.length === 0) {
      return null;
    }
    if (!ctx.captureId) {
      return null;
    }
    if (!settings.enabled) {
      return null;
    }

    // Get historical column metrics
    const history = await getHistoricalColumnMetrics(
      ctx.organizationId,
      ctx.captureId
    );

    // Not enough history to make a judgment
    if (history.length < MIN_OCCURRENCES) {
      return null;
    }

    // Check each column for new null occurrences
    const columnsWithNewNulls: Array<{
      name: string;
      nullCount: number;
      dtype: string;
    }> = [];

    for (const column of ctx.columns) {
      // Skip if this column doesn't have null tracking enabled
      if (column.null_count === null || column.null_count === undefined) {
        continue;
      }

      // Skip if no nulls in current data
      if (column.null_count === 0) {
        continue;
      }

      // Skip new columns (not in any historical data)
      if (!existedInHistory(column.name, history)) {
        continue;
      }

      // Check if this column has ever had nulls historically
      if (!hasHistoricalNulls(column.name, history)) {
        columnsWithNewNulls.push({
          name: column.name,
          nullCount: column.null_count,
          dtype: column.dtype,
        });
      }
    }

    // No columns with new null occurrences
    if (columnsWithNewNulls.length === 0) {
      return null;
    }

    // Severity is based on number of affected columns (no sensitivity config)
    // Multiple columns affected = critical, single column = warning
    // TODO: When adding critical event types, uncomment this line:
    // const computedSeverity = columnsWithNewNulls.length >= 2 ? "critical" : "warning";
    const severity: "warning" | "critical" = "warning"; // All current events are warnings for now

    return {
      shouldAlert: true,
      severity,
      metadata: {
        affectedColumns: columnsWithNewNulls,
        columnCount: columnsWithNewNulls.length,
        totalNullCount: columnsWithNewNulls.reduce((sum, c) => sum + c.nullCount, 0),
        historicalOccurrencesAnalyzed: history.length,
      },
    };
  },
};
