// ============================================================================
// ENUMS
// ============================================================================

export enum ErrorStatus {
  Open = "open",
  Resolved = "resolved",
  Ignored = "ignored",
}

export enum Timeframe {
  Day = "24h",
  Week = "7d",
  Month = "28d",
  AllTime = "all",
}

export enum RunStatusFilter {
  All = "all",
  Success = "success",
  Failed = "failed",
}

export enum RunType {
  Manual = "manual",
  Scheduled = "scheduled",
  Backfill = "backfill",
}

export enum EnvironmentType {
  Default = "default",
  NonDefault = "non-default",
}

// ============================================================================
// TYPES
// ============================================================================

export type EnvironmentFilter = string | null; // null means all environments

export interface OverviewMetrics {
  activeDags: number;
  totalRuns: number;
  failedRuns: number;
  totalDuration: number;
}

export interface HourlyStat {
  hour: string;
  success: number;
  failed: number;
}

export interface ErrorSummary {
  id: string;
  exceptionType: string;
  message: string;
  occurrenceCount: number;
  dagCount: number;
  lastSeenAt: Date;
  firstSeenAt: Date;
  status: string;
  environments?: string[];
}

export interface DagOverview {
  id: string;
  dagId: string;
  namespace: string;
  schedule: string | null;
  lastStatus: string | null;
  lastRunTime: Date | null;
  lastRunId: string | null;
  successRate: number;
  avgDuration: number | null;
  totalRuns: number;
  failedRuns: number;
  environments?: string[];
}

export interface DagStats {
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  successRate: number;
  avgDuration: number | null;
}

export interface EnvironmentStatus {
  environment: string;
  lastStatus: string | null;
  lastRunTime: Date | null;
  openErrorCount: number;
  openAlertCount: number;
}

export interface RunWithMetrics {
  id: string;
  runId: string;
  status: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  runType: string | null;
  environment?: string | null;
}

export interface AllDagRunsItem {
  id: string;
  srcDagId: string;
  srcRunId: string;
  status: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  runType: string | null;
  environment: string | null;
  taskCount: number;
  errorCount: number;
  schedule: string | null;
}

export interface RunErrorOccurrence {
  id: string;
  taskId: string | null;
  exceptionType: string;
  message: string;
  errorId: string;
  timestamp: Date | string;
  tryNumber: number | null;
  operator: string | null;
  stacktrace: unknown;
}
