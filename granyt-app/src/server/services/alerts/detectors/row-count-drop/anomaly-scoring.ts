/**
 * Anomaly Scoring Module
 *
 * Calculates anomaly scores from multiple signals and determines
 * whether an alert should be triggered.
 */

import {
  CohortStats,
  HistoricalRun,
  calculateCohortStats,
  extractRowCounts,
  filterBySameDayOfWeek,
  filterByRunType,
  filterNonZero,
  zScore,
} from "./cohort-stats";
import { AlertSensitivity } from "@prisma/client";
import { EffectiveAlertSettings } from "../../types";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Minimum requirements for detection
 */
export const DETECTION_REQUIREMENTS = {
  /** Absolute minimum runs for any detection */
  absoluteMinimum: 5,
  /** Minimum for full confidence */
  fullConfidence: 14,
  /** Minimum cohort size to use cohort baseline */
  minCohortSize: 3,
  /** Minimum baseline rows (avoid alerts for tiny datasets) */
  minBaselineRows: 100,
  /** Max zero rate before DAG is considered "zero-tolerant" */
  zeroToleranceThreshold: 0.1,
} as const;

/**
 * Drop thresholds by sensitivity level
 * A drop below (baseline * threshold) triggers an alert
 */
const DROP_THRESHOLDS: Record<AlertSensitivity, number> = {
  LOW: 0.01, // 99% drop
  MEDIUM: 0.05, // 95% drop
  HIGH: 0.1, // 90% drop
  CUSTOM: 0, // Uses customThreshold from settings
  DISABLED: 0, // Never triggers
};

/**
 * Weights for multi-signal scoring
 */
const _SIGNAL_WEIGHTS = {
  overallDeviation: 0.3,
  cohortDeviation: 0.5,
  recentTrend: 0.2,
} as const;

// ============================================================================
// Types
// ============================================================================

export interface AnomalySignals {
  /** Z-score from overall baseline */
  overallZScore: number;
  /** Z-score from same-day cohort */
  cohortZScore: number | null;
  /** Whether recent runs show a downward trend */
  recentTrendDown: boolean;
  /** Drop percentage from baseline */
  dropPercentage: number;
}

export interface ScoringResult {
  shouldAlert: boolean;
  severity: "warning" | "critical";
  confidence: "high" | "medium" | "low";
  signals: AnomalySignals;
  baseline: {
    type: "cohort" | "overall";
    value: number;
    cohortSize: number;
  };
  metadata: Record<string, unknown>;
}

export interface ScoringContext {
  currentRowCount: number;
  history: HistoricalRun[];
  currentDayOfWeek: number;
  currentRunType: string | null;
  settings: EffectiveAlertSettings;
}

// ============================================================================
// Threshold Calculation
// ============================================================================

/**
 * Get effective drop threshold based on sensitivity settings
 */
export function getEffectiveThreshold(settings: EffectiveAlertSettings): number {
  if (settings.sensitivity === AlertSensitivity.CUSTOM && settings.customThreshold != null) {
    // Custom threshold is stored as percentage (e.g., 85 means alert at 85% drop)
    // Convert to decimal threshold (e.g., 85% drop = keep 15% = 0.15)
    return (100 - settings.customThreshold) / 100;
  }
  return DROP_THRESHOLDS[settings.sensitivity];
}

/**
 * Get threshold label for metadata
 */
export function getThresholdLabel(settings: EffectiveAlertSettings): string {
  if (settings.sensitivity === AlertSensitivity.CUSTOM && settings.customThreshold != null) {
    return `CUSTOM (${settings.customThreshold}%)`;
  }
  return settings.sensitivity;
}

// ============================================================================
// Baseline Selection
// ============================================================================

interface BaselineResult {
  type: "cohort" | "overall";
  value: number;
  stats: CohortStats;
  cohortSize: number;
}

/**
 * Select the best baseline for comparison
 *
 * Priority:
 * 1. Same day-of-week cohort (if enough data)
 * 2. Same run-type cohort (if enough data)
 * 3. Overall non-zero baseline
 */
export function selectBaseline(
  history: HistoricalRun[],
  currentDayOfWeek: number,
  currentRunType: string | null
): BaselineResult | null {
  const nonZeroHistory = filterNonZero(history);

  // Not enough data for any baseline
  if (nonZeroHistory.length < DETECTION_REQUIREMENTS.absoluteMinimum) {
    return null;
  }

  // Try same day-of-week cohort first
  const sameDayCohort = filterBySameDayOfWeek(nonZeroHistory, currentDayOfWeek);
  if (sameDayCohort.length >= DETECTION_REQUIREMENTS.minCohortSize) {
    const stats = calculateCohortStats(extractRowCounts(sameDayCohort));
    if (stats.median >= DETECTION_REQUIREMENTS.minBaselineRows) {
      return {
        type: "cohort",
        value: stats.median,
        stats,
        cohortSize: sameDayCohort.length,
      };
    }
  }

  // Try same run-type cohort
  if (currentRunType) {
    const sameTypeCohort = filterByRunType(nonZeroHistory, currentRunType);
    if (sameTypeCohort.length >= DETECTION_REQUIREMENTS.minCohortSize) {
      const stats = calculateCohortStats(extractRowCounts(sameTypeCohort));
      if (stats.median >= DETECTION_REQUIREMENTS.minBaselineRows) {
        return {
          type: "cohort",
          value: stats.median,
          stats,
          cohortSize: sameTypeCohort.length,
        };
      }
    }
  }

  // Fall back to overall baseline
  const overallStats = calculateCohortStats(extractRowCounts(nonZeroHistory));
  if (overallStats.median < DETECTION_REQUIREMENTS.minBaselineRows) {
    return null; // Baseline too small
  }

  return {
    type: "overall",
    value: overallStats.median,
    stats: overallStats,
    cohortSize: nonZeroHistory.length,
  };
}

// ============================================================================
// Signal Calculation
// ============================================================================

/**
 * Calculate anomaly signals from multiple perspectives
 */
export function calculateSignals(
  currentRowCount: number,
  baseline: BaselineResult,
  history: HistoricalRun[],
  _currentDayOfWeek: number
): AnomalySignals {
  // Overall Z-score
  const overallStats = calculateCohortStats(extractRowCounts(filterNonZero(history)));
  const overallZScore = zScore(currentRowCount, overallStats.mean, overallStats.stdDev);

  // Cohort Z-score (if baseline is cohort-based)
  let cohortZScore: number | null = null;
  if (baseline.type === "cohort") {
    cohortZScore = zScore(currentRowCount, baseline.stats.mean, baseline.stats.stdDev);
  }

  // Recent trend (last 5 runs)
  const recentRuns = history.slice(0, 5);
  const recentTrendDown = isDownwardTrend(recentRuns, currentRowCount);

  // Drop percentage
  const dropPercentage = ((baseline.value - currentRowCount) / baseline.value) * 100;

  return {
    overallZScore,
    cohortZScore,
    recentTrendDown,
    dropPercentage,
  };
}

/**
 * Check if recent runs show a downward trend leading to current value
 */
function isDownwardTrend(recentRuns: HistoricalRun[], currentRowCount: number): boolean {
  if (recentRuns.length < 2) return false;

  // Check if values are generally decreasing
  const values = [currentRowCount, ...recentRuns.map((r) => r.rowCount)];
  let downCount = 0;

  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] < values[i]) {
      downCount++;
    }
  }

  // More than half of transitions are downward
  return downCount > (values.length - 1) / 2;
}

// ============================================================================
// Main Scoring Function
// ============================================================================

/**
 * Calculate comprehensive anomaly score and determine if alert should fire
 */
export function calculateAnomalyScore(ctx: ScoringContext): ScoringResult | null {
  const { currentRowCount, history, currentDayOfWeek, currentRunType, settings } = ctx;

  // 1. Select baseline
  const baseline = selectBaseline(history, currentDayOfWeek, currentRunType);
  if (!baseline) {
    return null; // Not enough data
  }

  // 2. Check zero tolerance
  const overallStats = calculateCohortStats(extractRowCounts(history));
  const isZeroTolerant = overallStats.zeroRate > DETECTION_REQUIREMENTS.zeroToleranceThreshold;

  if (isZeroTolerant && currentRowCount === 0) {
    return null; // Pipeline normally has zeros, don't alert
  }

  // 3. Calculate signals
  const signals = calculateSignals(currentRowCount, baseline, history, currentDayOfWeek);

  // 4. Apply threshold
  const threshold = getEffectiveThreshold(settings);
  const dropThresholdValue = baseline.value * threshold;

  // 5. Determine if alert should fire
  const shouldAlert = currentRowCount < dropThresholdValue;

  if (!shouldAlert) {
    return null;
  }

  // 6. Determine severity
  // TODO: When adding critical event types, uncomment this line:
  // const computedSeverity: "warning" | "critical" = currentRowCount === 0 ? "critical" : "warning";
  const severity: "warning" | "critical" = "warning"; // All current events are warnings for now

  // 7. Determine confidence
  const confidence = determineConfidence(baseline, history.length, signals);

  return {
    shouldAlert: true,
    severity,
    confidence,
    signals,
    baseline: {
      type: baseline.type,
      value: Math.round(baseline.value),
      cohortSize: baseline.cohortSize,
    },
    metadata: buildMetadata(baseline, signals, overallStats, settings, history.length),
  };
}

/**
 * Determine confidence level based on data quality
 */
function determineConfidence(
  baseline: BaselineResult,
  historyCount: number,
  signals: AnomalySignals
): "high" | "medium" | "low" {
  // High confidence: enough history + cohort baseline + strong signal
  if (
    historyCount >= DETECTION_REQUIREMENTS.fullConfidence &&
    baseline.type === "cohort" &&
    Math.abs(signals.overallZScore) > 3
  ) {
    return "high";
  }

  // Medium confidence: decent history or strong signal
  if (historyCount >= DETECTION_REQUIREMENTS.absoluteMinimum * 2 || Math.abs(signals.overallZScore) > 2) {
    return "medium";
  }

  return "low";
}

/**
 * Build metadata for the alert
 */
function buildMetadata(
  baseline: BaselineResult,
  signals: AnomalySignals,
  overallStats: CohortStats,
  settings: EffectiveAlertSettings,
  runsAnalyzed: number
): Record<string, unknown> {
  return {
    baseline: Math.round(baseline.value),
    current: signals.dropPercentage > 99.99 ? 0 : Math.round(baseline.value * (1 - signals.dropPercentage / 100)),
    dropPercentage: Math.round(signals.dropPercentage * 100) / 100,
    baselineType: baseline.type,
    cohortSize: baseline.cohortSize,
    overallZScore: Math.round(signals.overallZScore * 100) / 100,
    cohortZScore: signals.cohortZScore ? Math.round(signals.cohortZScore * 100) / 100 : null,
    historicalZeroRate: Math.round(overallStats.zeroRate * 1000) / 10,
    runsAnalyzed,
    threshold: getThresholdLabel(settings),
    customThreshold: settings.customThreshold,
  };
}
