/**
 * Custom Metric Drop Detector
 *
 * Detects sudden drops in custom numeric metrics using cohort-based analysis.
 * Adapts the row-count-drop detector pattern for user-defined metrics.
 */

import { prisma } from "@/lib/prisma";
import { getNumericMetric } from "@/lib/json-schemas";
import { AlertSensitivity, CustomMetricMonitor } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export interface CustomMetricDropResult {
  shouldAlert: boolean;
  severity: "warning" | "critical";
  metadata: {
    metricName: string;
    current: number;
    baseline: number;
    dropPercentage: number;
    runsAnalyzed: number;
    threshold: string;
    confidence: "high" | "medium" | "low";
  };
}

interface HistoricalMetricValue {
  value: number;
  capturedAt: Date;
}

// ============================================================================
// Configuration
// ============================================================================

const DETECTION_REQUIREMENTS = {
  absoluteMinimum: 5,
  fullConfidence: 14,
  minBaselineValue: 0.001, // For percentages/ratios
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

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Detect sharp drops in a custom metric value
 */
export async function detectCustomMetricDrop(
  organizationId: string,
  srcDagId: string,
  metricName: string,
  currentValue: number,
  monitor: CustomMetricMonitor
): Promise<CustomMetricDropResult | null> {
  // Early exit if disabled
  if (monitor.sensitivity === AlertSensitivity.DISABLED) {
    return null;
  }

  // Fetch historical values for this metric
  const history = await fetchHistoricalMetricValues(
    organizationId,
    srcDagId,
    metricName,
    60 // Fetch last 60 data points
  );

  // Not enough history
  if (history.length < DETECTION_REQUIREMENTS.absoluteMinimum) {
    return null;
  }

  // Calculate baseline (median of non-zero historical values)
  const nonZeroValues = history.map((h) => h.value).filter((v) => v > 0);
  if (nonZeroValues.length < DETECTION_REQUIREMENTS.absoluteMinimum) {
    return null;
  }

  const baseline = calculateMedian(nonZeroValues);

  // Skip if baseline is too small
  if (baseline < DETECTION_REQUIREMENTS.minBaselineValue) {
    return null;
  }

  // Get effective threshold
  const threshold = getEffectiveThreshold(monitor);
  const dropThresholdValue = baseline * threshold;

  // Check if current value is below threshold
  const shouldAlert = currentValue < dropThresholdValue;

  if (!shouldAlert) {
    return null;
  }

  // Calculate drop percentage
  const dropPercentage = ((baseline - currentValue) / baseline) * 100;

  // Determine confidence based on data quality
  const confidence = determineConfidence(history.length);

  // Determine severity
  const severity: "warning" | "critical" = currentValue === 0 ? "critical" : "warning";

  return {
    shouldAlert: true,
    severity,
    metadata: {
      metricName,
      current: Math.round(currentValue * 10000) / 10000,
      baseline: Math.round(baseline * 10000) / 10000,
      dropPercentage: Math.round(dropPercentage * 100) / 100,
      runsAnalyzed: history.length,
      threshold: getThresholdLabel(monitor),
      confidence,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch historical values for a specific custom metric
 */
async function fetchHistoricalMetricValues(
  organizationId: string,
  srcDagId: string,
  metricName: string,
  limit: number
): Promise<HistoricalMetricValue[]> {
  const metrics = await prisma.metric.findMany({
    where: {
      organizationId,
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
    skip: 1, // Skip current run
    take: limit,
  });

  const values: HistoricalMetricValue[] = [];

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
 * Calculate median of values
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Get effective threshold based on sensitivity settings
 */
function getEffectiveThreshold(monitor: CustomMetricMonitor): number {
  if (monitor.sensitivity === AlertSensitivity.CUSTOM && monitor.customThreshold != null) {
    // Custom threshold is stored as percentage (e.g., 85 means alert at 85% drop)
    // Convert to decimal threshold (e.g., 85% drop = keep 15% = 0.15)
    return (100 - monitor.customThreshold) / 100;
  }
  return DROP_THRESHOLDS[monitor.sensitivity];
}

/**
 * Get threshold label for metadata
 */
function getThresholdLabel(monitor: CustomMetricMonitor): string {
  if (monitor.sensitivity === AlertSensitivity.CUSTOM && monitor.customThreshold != null) {
    return `CUSTOM (${monitor.customThreshold}%)`;
  }
  return monitor.sensitivity;
}

/**
 * Determine confidence level based on data quality
 */
function determineConfidence(historyCount: number): "high" | "medium" | "low" {
  if (historyCount >= DETECTION_REQUIREMENTS.fullConfidence) {
    return "high";
  }
  if (historyCount >= DETECTION_REQUIREMENTS.absoluteMinimum * 2) {
    return "medium";
  }
  return "low";
}
