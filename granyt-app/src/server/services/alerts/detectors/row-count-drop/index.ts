/**
 * Row Count Drop Detector
 *
 * Detects sudden drops in row count using context-aware cohort-based analysis.
 *
 * Key Features:
 * - Compares to same day-of-week baseline when possible
 * - Falls back to overall baseline gracefully
 * - Adapts to pipeline variance patterns
 * - Avoids false positives for zero-tolerant pipelines
 *
 * Architecture:
 * - cohort-stats.ts: Statistical utilities
 * - historical-data.ts: Data fetching with temporal enrichment
 * - anomaly-scoring.ts: Multi-signal scoring logic
 * - index.ts (this file): Detector entry point
 */

import {
  AlertDetector,
  DetectorContext,
  DetectionResult,
  EffectiveAlertSettings,
  AlertType,
  AlertSensitivity,
} from "../../types";
import { fetchHistoricalRuns, fetchCurrentRunMetadata, getCurrentRunContext } from "./historical-data";
import { calculateAnomalyScore, DETECTION_REQUIREMENTS } from "./anomaly-scoring";

/**
 * Row Count Drop Detector
 *
 * Uses cohort-based comparison to intelligently detect row count anomalies
 * while minimizing false positives from expected variance patterns.
 */
export const rowCountDropDetector: AlertDetector = {
  type: AlertType.ROW_COUNT_DROP,

  async detect(
    ctx: DetectorContext,
    settings: EffectiveAlertSettings
  ): Promise<DetectionResult | null> {
    // Early exit conditions
    if (!shouldProcess(ctx, settings)) {
      return null;
    }

    // Fetch historical data with temporal enrichment
    const history = await fetchHistoricalRuns(ctx.organizationId, ctx.captureId!, {
      limit: 60, // More history for better cohort analysis
    });

    // Not enough history
    if (history.length < DETECTION_REQUIREMENTS.absoluteMinimum) {
      return null;
    }

    // Get current run's temporal context
    const runMetadata = await fetchCurrentRunMetadata(ctx.dagRunId);
    const currentTime = runMetadata?.startTime ?? new Date();
    const temporalContext = getCurrentRunContext(currentTime);

    // Calculate anomaly score with cohort-based analysis
    const result = calculateAnomalyScore({
      currentRowCount: ctx.rowCount!,
      history,
      currentDayOfWeek: temporalContext.dayOfWeek,
      currentRunType: runMetadata?.runType ?? null,
      settings,
    });

    if (!result) {
      return null;
    }

    return {
      shouldAlert: result.shouldAlert,
      severity: result.severity,
      metadata: {
        ...result.metadata,
        confidence: result.confidence,
        current: ctx.rowCount,
      },
    };
  },
};

/**
 * Check if detection should proceed
 */
function shouldProcess(ctx: DetectorContext, settings: EffectiveAlertSettings): boolean {
  // No row count data
  if (ctx.rowCount === undefined || ctx.rowCount === null) {
    return false;
  }

  // No capture ID
  if (!ctx.captureId) {
    return false;
  }

  // Detection disabled
  if (settings.sensitivity === AlertSensitivity.DISABLED) {
    return false;
  }

  return true;
}

// Re-export for backwards compatibility if needed
export { DETECTION_REQUIREMENTS } from "./anomaly-scoring";
