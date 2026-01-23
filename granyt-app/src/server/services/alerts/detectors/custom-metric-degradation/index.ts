/**
 * Custom Metric Degradation Detector
 *
 * Detects gradual decline patterns in custom metrics over time.
 * Uses linear regression to identify sustained downward trends.
 */

import { prisma } from "@/lib/prisma";
import { getNumericMetric } from "@/lib/json-schemas";
import { CustomMetricMonitor } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export interface CustomMetricDegradationResult {
  shouldAlert: boolean;
  severity: "warning" | "critical";
  metadata: {
    metricName: string;
    startValue: number;
    endValue: number;
    declinePercentage: number;
    windowDays: number;
    dataPointsAnalyzed: number;
    slopePerDay: number;
    rSquared: number;
    trendConfidence: "high" | "medium" | "low";
  };
}

interface HistoricalDataPoint {
  value: number;
  capturedAt: Date;
}

interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DETECTION_REQUIREMENTS = {
  minDataPoints: 5,
  minRSquared: 0.5, // Moderate correlation required
} as const;

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Detect slow degradation in a custom metric value
 */
export async function detectCustomMetricDegradation(
  organizationId: string,
  srcDagId: string,
  metricName: string,
  currentValue: number,
  monitor: CustomMetricMonitor
): Promise<CustomMetricDegradationResult | null> {
  const windowDays = monitor.windowDays;
  const minDeclinePercent = monitor.minDeclinePercent;

  // Fetch historical values within the window
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);

  const history = await fetchHistoricalMetricValues(
    organizationId,
    srcDagId,
    metricName,
    windowStart
  );

  // Add current value to the dataset
  const allDataPoints: HistoricalDataPoint[] = [
    { value: currentValue, capturedAt: new Date() },
    ...history,
  ];

  // Not enough data points
  if (allDataPoints.length < DETECTION_REQUIREMENTS.minDataPoints) {
    return null;
  }

  // Perform linear regression
  const regression = calculateLinearRegression(allDataPoints);

  // Check degradation conditions
  const isDegrading =
    regression.slope < 0 && // Downward trend
    regression.rSquared >= DETECTION_REQUIREMENTS.minRSquared; // Strong enough correlation

  if (!isDegrading) {
    return null;
  }

  // Calculate total decline
  const sortedByTime = [...allDataPoints].sort(
    (a, b) => a.capturedAt.getTime() - b.capturedAt.getTime()
  );
  const firstValue = sortedByTime[0].value;
  const lastValue = sortedByTime[sortedByTime.length - 1].value;

  // Avoid division by zero
  if (firstValue === 0) {
    return null;
  }

  const declinePercentage = ((firstValue - lastValue) / firstValue) * 100;

  // Check if decline meets threshold
  if (declinePercentage < minDeclinePercent) {
    return null;
  }

  // Determine severity and confidence
  const severity: "warning" | "critical" = declinePercentage >= 30 ? "critical" : "warning";
  const trendConfidence = regression.rSquared >= 0.8 ? "high" : regression.rSquared >= 0.6 ? "medium" : "low";

  return {
    shouldAlert: true,
    severity,
    metadata: {
      metricName,
      startValue: Math.round(firstValue * 10000) / 10000,
      endValue: Math.round(lastValue * 10000) / 10000,
      declinePercentage: Math.round(declinePercentage * 100) / 100,
      windowDays,
      dataPointsAnalyzed: allDataPoints.length,
      slopePerDay: Math.round(regression.slope * 10000) / 10000,
      rSquared: Math.round(regression.rSquared * 1000) / 1000,
      trendConfidence,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch historical values for a specific custom metric within a time window
 */
async function fetchHistoricalMetricValues(
  organizationId: string,
  srcDagId: string,
  metricName: string,
  windowStart: Date
): Promise<HistoricalDataPoint[]> {
  const metrics = await prisma.metric.findMany({
    where: {
      organizationId,
      capturedAt: { gte: windowStart },
      taskRun: {
        dagRun: {
          srcDagId,
        },
      },
    },
    select: {
      metrics: true,
      capturedAt: true,
    },
    orderBy: {
      capturedAt: "desc",
    },
    skip: 1, // Skip current run (we'll add it manually)
    take: 100, // Reasonable limit
  });

  const values: HistoricalDataPoint[] = [];

  for (const metric of metrics) {
    const metricsObj =
      typeof metric.metrics === "object" && metric.metrics !== null
        ? (metric.metrics as Record<string, unknown>)
        : {};

    const value = getNumericMetric(metricsObj, metricName);
    if (value !== null && value !== undefined) {
      values.push({
        value,
        capturedAt: metric.capturedAt,
      });
    }
  }

  return values;
}

/**
 * Calculate linear regression for data points
 * Returns slope (change per day), intercept, and R-squared
 */
function calculateLinearRegression(points: HistoricalDataPoint[]): LinearRegressionResult {
  if (points.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  const n = points.length;

  // Normalize time to days from first point
  const sortedPoints = [...points].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
  const startTime = sortedPoints[0].capturedAt.getTime();

  const normalizedPoints = sortedPoints.map((p) => ({
    x: (p.capturedAt.getTime() - startTime) / (1000 * 60 * 60 * 24), // Convert to days
    y: p.value,
  }));

  // Calculate means
  const sumX = normalizedPoints.reduce((sum, p) => sum + p.x, 0);
  const sumY = normalizedPoints.reduce((sum, p) => sum + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;
  for (const p of normalizedPoints) {
    numerator += (p.x - meanX) * (p.y - meanY);
    denominator += (p.x - meanX) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  // Calculate R-squared
  let ssRes = 0;
  let ssTot = 0;
  for (const p of normalizedPoints) {
    const predicted = slope * p.x + intercept;
    ssRes += (p.y - predicted) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }

  const rSquared = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  return { slope, intercept, rSquared };
}
