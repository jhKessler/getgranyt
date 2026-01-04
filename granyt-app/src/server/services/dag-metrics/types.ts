import { Timeframe } from "../dashboard/types";

// ============================================================================
// ENUMS
// ============================================================================

export enum MetricType {
  Builtin = "builtin",
  Custom = "custom",
}

export enum Aggregation {
  Avg = "avg",
  Total = "total",
  Last = "last",
}

// ============================================================================
// BUILT-IN METRICS CONFIGURATION
// ============================================================================

export const BUILTIN_METRICS = [
  { id: "total_runs", label: "Total Runs", type: MetricType.Builtin },
  { id: "success_rate", label: "Success Rate", type: MetricType.Builtin },
  { id: "successful_runs", label: "Successful Runs", type: MetricType.Builtin },
  { id: "failed_runs", label: "Failed Runs", type: MetricType.Builtin },
] as const;

export type BuiltinMetricId = (typeof BUILTIN_METRICS)[number]["id"];

export const DEFAULT_METRICS: MetricConfig[] = [
  { id: "total_runs", type: MetricType.Builtin, enabled: true, order: 0 },
  { id: "success_rate", type: MetricType.Builtin, enabled: true, order: 1 },
  { id: "successful_runs", type: MetricType.Builtin, enabled: true, order: 2 },
  { id: "failed_runs", type: MetricType.Builtin, enabled: true, order: 3 },
];

export const MAX_SELECTED_METRICS = 8;

// ============================================================================
// TYPES
// ============================================================================

export interface MetricConfig {
  id: string;
  type: MetricType;
  aggregation?: Aggregation; // Only for custom metrics
  enabled: boolean;
  order: number;
}

export interface MetricsSettingsInput {
  userId: string;
  organizationId: string;
  dagId?: string | null; // null = default settings
  selectedMetrics: MetricConfig[];
}

export interface GetMetricsSettingsParams {
  userId: string;
  organizationId: string;
  dagId?: string | null;
}

export interface MetricsSettingsResult {
  id: string;
  userId: string;
  organizationId: string;
  dagId: string | null;
  selectedMetrics: MetricConfig[];
  isDefault: boolean; // true if using fallback default settings
}

// ============================================================================
// COMPUTED METRICS TYPES
// ============================================================================

export interface CustomMetricAggregation {
  sum: number;
  count: number;
  lastValue?: number;
}

export interface ComputedMetricsData {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  totalRows: number; // Converted from BigInt for JSON serialization
  avgRows: number | null;
  totalDuration: number; // Converted from BigInt for JSON serialization
  avgDuration: number | null;
  customMetrics: Record<string, CustomMetricAggregation> | null;
}

export interface UpdateComputedMetricsParams {
  organizationId: string;
  dagId: string;
  environment: string | null;
  runStatus: "success" | "failed" | "running";
  runDuration: number | null;
  rowCount: number;
  customMetrics: Record<string, number> | null;
}

export interface GetComputedMetricsParams {
  organizationId: string;
  dagId: string;
  environment?: string | null;
  timeframe: Timeframe;
}

// Available custom metrics for a DAG (for UI display)
export interface AvailableMetricsResult {
  builtinMetrics: typeof BUILTIN_METRICS;
  customMetrics: string[]; // Metric names from this DAG's runs
}

// Computed metric value for display
export interface MetricValue {
  id: string;
  label: string;
  value: number | string;
  type: MetricType;
  aggregation?: Aggregation;
}
