/**
 * Centralized status color utilities
 * 
 * This module provides consistent color styling for status indicators
 * throughout the application.
 */

/**
 * Run status enum for DAG/task execution states
 */
export enum RunStatus {
  Success = "success",
  Failed = "failed",
  Running = "running",
  Warning = "warning",
}

/**
 * Error status enum for error tracking states
 */
export enum ErrorStatus {
  Open = "open",
  Resolved = "resolved",
  Ignored = "ignored",
}

/**
 * Connector status enum for connector states
 */
export enum ConnectorStatus {
  Active = "active",
  Inactive = "inactive",
  Pending = "pending",
}

// =============================================================================
// Tailwind Classes (for badges, indicators, etc.)
// =============================================================================

/**
 * Badge-style classes with background, text, and border colors
 */
export const RUN_STATUS_BADGE_STYLES: Record<RunStatus, string> = {
  [RunStatus.Success]: "bg-green-500/10 text-green-500 border-green-500/20",
  [RunStatus.Failed]: "bg-destructive/10 text-destructive border-destructive/20",
  [RunStatus.Running]: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  [RunStatus.Warning]: "bg-orange-500/10 text-orange-500 border-orange-500/20",
}

export const ERROR_STATUS_BADGE_STYLES: Record<ErrorStatus, string> = {
  [ErrorStatus.Open]: "bg-destructive/10 text-destructive border-destructive/20",
  [ErrorStatus.Resolved]: "bg-green-500/10 text-green-500 border-green-500/20",
  [ErrorStatus.Ignored]: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
}

export const CONNECTOR_STATUS_BADGE_STYLES: Record<ConnectorStatus, string> = {
  [ConnectorStatus.Active]: "bg-green-500/10 text-green-500 border-green-500/20",
  [ConnectorStatus.Inactive]: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  [ConnectorStatus.Pending]: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
}

/**
 * Simple background color classes (for dots, indicators)
 */
export const RUN_STATUS_DOT_COLORS: Record<RunStatus, string> = {
  [RunStatus.Success]: "bg-green-500",
  [RunStatus.Failed]: "bg-red-500",
  [RunStatus.Running]: "bg-blue-500",
  [RunStatus.Warning]: "bg-orange-500",
}

// =============================================================================
// HSL Colors (for charts)
// =============================================================================

export const STATUS_CHART_COLORS = {
  success: "hsl(142, 76%, 36%)",
  failed: "hsl(0, 84%, 60%)",
  running: "hsl(221, 83%, 53%)",
  warning: "hsl(24, 94%, 50%)",
} as const

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get badge classes for a run status
 */
export function getRunStatusBadgeStyle(status: string | null): string {
  if (!status) return ""
  const normalizedStatus = status.toLowerCase() as RunStatus
  return RUN_STATUS_BADGE_STYLES[normalizedStatus] ?? ""
}

/**
 * Get dot/indicator background color for a run status
 */
export function getRunStatusDotColor(status: string | null): string {
  if (!status) return "bg-muted-foreground"
  const normalizedStatus = status.toLowerCase() as RunStatus
  return RUN_STATUS_DOT_COLORS[normalizedStatus] ?? "bg-muted-foreground"
}

/**
 * Get chart color for a run status
 */
export function getRunStatusChartColor(status: string): string {
  const normalizedStatus = status.toLowerCase()
  if (normalizedStatus === "success") return STATUS_CHART_COLORS.success
  if (normalizedStatus === "failed") return STATUS_CHART_COLORS.failed
  if (normalizedStatus === "warning") return STATUS_CHART_COLORS.warning
  return STATUS_CHART_COLORS.running
}

/**
 * Get badge classes for an error status
 */
export function getErrorStatusBadgeStyle(status: string): string {
  const normalizedStatus = status.toLowerCase() as ErrorStatus
  return ERROR_STATUS_BADGE_STYLES[normalizedStatus] ?? ERROR_STATUS_BADGE_STYLES[ErrorStatus.Open]
}

/**
 * Get badge classes for a connector status
 */
export function getConnectorStatusBadgeStyle(status: string): string {
  const normalizedStatus = status.toLowerCase() as ConnectorStatus
  return CONNECTOR_STATUS_BADGE_STYLES[normalizedStatus] ?? CONNECTOR_STATUS_BADGE_STYLES[ConnectorStatus.Pending]
}

/**
 * Get text color class based on success rate percentage
 */
export function getSuccessRateColorClass(rate: number): string {
  if (rate >= 90) return "text-green-500"
  if (rate >= 70) return "text-yellow-500"
  return "text-destructive"
}
