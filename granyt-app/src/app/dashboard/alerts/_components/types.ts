export interface AlertMetadata {
  // ROW_COUNT_DROP metadata
  baseline?: number
  current?: number
  dropPercentage?: number
  runsAnalyzed?: number
  threshold?: string
  historicalZeroRate?: number
  customThreshold?: number
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

export const STATUS_CONFIG = {
  OPEN: { label: "Open", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  ACKNOWLEDGED: { label: "Acknowledged", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  DISMISSED: { label: "Dismissed", color: "bg-muted text-muted-foreground" },
  AUTO_RESOLVED: { label: "Resolved", color: "bg-green-500/10 text-green-500 border-green-500/20" },
} as const

export const SENSITIVITY_CONFIG = {
  DISABLED: { label: "Disabled", description: "No alerts will be triggered", threshold: "-" },
  LOW: { label: "Low", description: "Only trigger on severe drops (99%+)", threshold: "99%" },
  MEDIUM: { label: "Medium", description: "Trigger on significant drops (95%+)", threshold: "95%" },
  HIGH: { label: "High", description: "Trigger on moderate drops (90%+)", threshold: "90%" },
  CUSTOM: { label: "Custom", description: "Custom threshold configured", threshold: "Custom" },
} as const

export type SensitivityLevel = keyof typeof SENSITIVITY_CONFIG
export type AlertStatus = keyof typeof STATUS_CONFIG

/**
 * Returns true if the alert type only supports enable/disable (no sensitivity levels)
 */
export function isBinaryAlert(type: string): boolean {
  return type === "SCHEMA_CHANGE" || type === "NULL_OCCURRENCE"
}
