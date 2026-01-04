export interface AlertMetadata {
  // ROW_COUNT_DROP metadata
  baseline?: number
  current?: number
  dropPercentage?: number
  runsAnalyzed?: number
  threshold?: string
  historicalZeroRate?: number
  customThreshold?: number
  baselineType?: "cohort" | "overall"
  cohortSize?: number
  overallZScore?: number
  cohortZScore?: number | null
  confidence?: "high" | "medium" | "low"
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

export interface AlertData {
  id: string
  alertType: string
  srcDagId: string
  captureId: string | null
  dagRunId: string
  srcRunId: string
  status: string
  severity: string | null
  metadata?: unknown
  dismissReason: string | null
  createdAt: Date | string
  acknowledgedAt: Date | string | null
  dismissedAt: Date | string | null
}
