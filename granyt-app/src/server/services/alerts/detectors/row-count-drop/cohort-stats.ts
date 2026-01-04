/**
 * Cohort Statistics Module
 *
 * Provides statistical utilities for analyzing row count data.
 * Used by the row count drop detector for baseline calculations.
 */

// ============================================================================
// Types
// ============================================================================

export interface CohortStats {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  coefficientOfVariation: number;
  min: number;
  max: number;
  percentiles: {
    p5: number;
    p25: number;
    p75: number;
    p95: number;
  };
  zeroRate: number;
}

export interface HistoricalRun {
  rowCount: number;
  capturedAt: Date;
  runType: string | null;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hourOfDay: number; // 0-23
}

// ============================================================================
// Statistical Functions
// ============================================================================

/**
 * Calculate the median of a sorted array
 */
export function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate mean of an array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function stdDev(values: number[], meanValue?: number): number {
  if (values.length < 2) return 0;
  const avg = meanValue ?? mean(values);
  const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
}

/**
 * Calculate percentile from sorted array
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const fraction = index - lower;
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

/**
 * Calculate Z-score (how many standard deviations from mean)
 */
export function zScore(value: number, meanVal: number, stdDevVal: number): number {
  if (stdDevVal === 0) return value === meanVal ? 0 : Infinity;
  return (value - meanVal) / stdDevVal;
}

// ============================================================================
// Cohort Statistics Calculation
// ============================================================================

/**
 * Calculate comprehensive statistics for a cohort of row counts
 */
export function calculateCohortStats(rowCounts: number[]): CohortStats {
  if (rowCounts.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      coefficientOfVariation: 0,
      min: 0,
      max: 0,
      percentiles: { p5: 0, p25: 0, p75: 0, p95: 0 },
      zeroRate: 0,
    };
  }

  const sorted = [...rowCounts].sort((a, b) => a - b);
  const meanVal = mean(rowCounts);
  const stdDevVal = stdDev(rowCounts, meanVal);
  const zeroCount = rowCounts.filter((r) => r === 0).length;

  return {
    count: rowCounts.length,
    mean: meanVal,
    median: median(sorted),
    stdDev: stdDevVal,
    coefficientOfVariation: meanVal > 0 ? stdDevVal / meanVal : 0,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    percentiles: {
      p5: percentile(sorted, 5),
      p25: percentile(sorted, 25),
      p75: percentile(sorted, 75),
      p95: percentile(sorted, 95),
    },
    zeroRate: zeroCount / rowCounts.length,
  };
}

// ============================================================================
// Cohort Filtering
// ============================================================================

/**
 * Filter runs by day of week
 */
export function filterBySameDayOfWeek(
  runs: HistoricalRun[],
  targetDayOfWeek: number
): HistoricalRun[] {
  return runs.filter((r) => r.dayOfWeek === targetDayOfWeek);
}

/**
 * Filter runs by run type (manual, scheduled, etc.)
 */
export function filterByRunType(
  runs: HistoricalRun[],
  targetRunType: string | null
): HistoricalRun[] {
  if (!targetRunType) return runs;
  return runs.filter((r) => r.runType === targetRunType);
}

/**
 * Filter runs to exclude zeros (for baseline calculation)
 */
export function filterNonZero(runs: HistoricalRun[]): HistoricalRun[] {
  return runs.filter((r) => r.rowCount > 0);
}

/**
 * Filter runs by time window (hours)
 */
export function filterByTimeWindow(
  runs: HistoricalRun[],
  targetHour: number,
  windowHours: number = 2
): HistoricalRun[] {
  return runs.filter((r) => {
    const diff = Math.abs(r.hourOfDay - targetHour);
    // Handle wrap-around (e.g., 23:00 is close to 01:00)
    const adjustedDiff = Math.min(diff, 24 - diff);
    return adjustedDiff <= windowHours;
  });
}

/**
 * Extract row counts from historical runs
 */
export function extractRowCounts(runs: HistoricalRun[]): number[] {
  return runs.map((r) => r.rowCount);
}
