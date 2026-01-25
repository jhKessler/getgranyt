export interface AlertMetadata {
  // ROW_COUNT_DROP metadata
  baseline?: number
  current?: number
  dropPercentage?: number
  runsAnalyzed?: number
  threshold?: string
  historicalZeroRate?: number
  customThreshold?: number
  baselineType?: "cohort" | "overall" // Whether baseline uses same day-of-week cohort or overall average
  cohortSize?: number // Number of runs in the cohort used for comparison
  overallZScore?: number // Statistical deviation from overall mean
  cohortZScore?: number | null // Statistical deviation from cohort mean
  confidence?: "high" | "medium" | "low" // Detection confidence level
  // NULL_OCCURRENCE metadata
  affectedColumns?: Array<{ name: string; nullCount: number; dtype: string }>
  columnCount?: number
  totalNullCount?: number
  historicalOccurrencesAnalyzed?: number
  sensitivity?: string
  // SCHEMA_CHANGE metadata
  changes?: Array<{
    type: "added" | "removed" | "type_changed"
    columnName: string
    previousType?: string
    currentType?: string
  }>
  summary?: {
    addedCount: number
    removedCount: number
    typeChangedCount: number
    totalChanges: number
  }
  addedColumns?: Array<{ name: string; type?: string }>
  removedColumns?: Array<{ name: string; type?: string }>
  typeChangedColumns?: Array<{ name: string; previousType?: string; currentType?: string }>
  previousColumnCount?: number
  currentColumnCount?: number
}

export const SENSITIVITY_OPTIONS = {
  HIGH: { label: "High", description: "90%+ drop triggers alert", color: "text-red-500" },
  MEDIUM: { label: "Medium", description: "95%+ drop triggers alert", color: "text-orange-500" },
  LOW: { label: "Low", description: "99%+ drop triggers alert", color: "text-yellow-500" },
  CUSTOM: { label: "Custom", description: "Set your own threshold", color: "text-purple-500" },
  DISABLED: { label: "Disabled", description: "No alerts", color: "text-muted-foreground" },
} as const

export type SensitivityLevel = keyof typeof SENSITIVITY_OPTIONS

export interface AlertData {
  id: string
  alertType: string
  srcDagId: string
  captureId: string | null
  dagRunId: string
  srcRunId: string // Source system run ID (e.g., Airflow run_id)
  status: string
  severity: string | null
  metadata?: unknown
  dismissReason: string | null
  createdAt: Date | string
  acknowledgedAt: Date | string | null
  dismissedAt: Date | string | null
  environment?: string | null
}

/**
 * Returns true if the alert type only supports enable/disable (no sensitivity levels)
 */
export function isBinaryAlert(type: string): boolean {
  return type === "SCHEMA_CHANGE" || type === "NULL_OCCURRENCE"
}
