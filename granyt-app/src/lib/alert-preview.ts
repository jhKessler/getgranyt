import type { AlertType } from "@prisma/client"

/**
 * Alert Preview Text Generator
 * 
 * This module provides a centralized, extensible system for generating human-readable
 * preview text for alerts. When adding new alert types, simply add a new entry to
 * the ALERT_PREVIEW_GENERATORS object.
 * 
 * Usage:
 *   import { getAlertPreviewText } from "@/lib/alert-preview"
 *   const preview = getAlertPreviewText("ROW_COUNT_DROP", metadata)
 * 
 * To add a new alert type:
 *   1. Add the type to AlertType enum in prisma schema
 *   2. Add a generator function to ALERT_PREVIEW_GENERATORS below
 *   That's it! The preview will automatically appear everywhere 🚀
 */

/**
 * Metadata structure for different alert types
 * Add new fields here when creating new alert types
 */
export interface AlertMetadata {
  // ROW_COUNT_DROP
  baseline?: number
  current?: number
  dropPercentage?: number
  
  // NULL_OCCURRENCE
  affectedColumns?: Array<{ name: string; nullCount?: number; dtype?: string }>
  columnCount?: number
  totalNullCount?: number
  
  // SCHEMA_CHANGE
  summary?: {
    addedCount: number
    removedCount: number
    typeChangedCount: number
    totalChanges: number
  }
  addedColumns?: Array<{ name: string; type?: string }>
  removedColumns?: Array<{ name: string; type?: string }>
  typeChangedColumns?: Array<{ name: string; previousType?: string; currentType?: string }>

  // CUSTOM_METRIC_DROP
  metricName?: string

  // CUSTOM_METRIC_DEGRADATION
  startValue?: number
  endValue?: number
  declinePercentage?: number
  windowDays?: number
  dataPointsAnalyzed?: number
  slopePerDay?: number
  rSquared?: number
  trendConfidence?: string
  monitorName?: string

  // Generic fields that might be used by multiple alert types
  [key: string]: unknown
}

/**
 * Generator function type for alert preview text
 * Each generator receives metadata and returns a human-readable string
 */
type AlertPreviewGenerator = (metadata: AlertMetadata | undefined) => string

/**
 * Alert preview generators registry
 * 
 * To add a new alert type, add a new entry here. The key should match
 * the AlertType enum value from Prisma.
 */
const ALERT_PREVIEW_GENERATORS: Record<AlertType, AlertPreviewGenerator> = {
  ROW_COUNT_DROP: (metadata) => {
    if (!metadata || metadata.dropPercentage === undefined) {
      return "Row count dropped significantly"
    }
    
    const drop = Math.round(metadata.dropPercentage)
    const current = metadata.current ?? 0
    const baseline = metadata.baseline
    
    if (baseline !== undefined) {
      return `Row count dropped ${drop}% (${current.toLocaleString()} → was ${baseline.toLocaleString()})`
    }
    
    return `Row count dropped ${drop}%`
  },

  NULL_OCCURRENCE: (metadata) => {
    if (!metadata?.affectedColumns || metadata.affectedColumns.length === 0) {
      return "Null values detected in previously non-null columns"
    }
    
    const count = metadata.columnCount ?? metadata.affectedColumns.length
    const columnNames = metadata.affectedColumns.slice(0, 2).map(c => c.name).join(", ")
    
    if (count === 1) {
      return `Null values appeared in column: ${columnNames}`
    }
    
    if (count <= 2) {
      return `Null values appeared in ${count} columns: ${columnNames}`
    }
    
    const extra = count - 2
    return `Null values appeared in ${count} columns: ${columnNames} +${extra} more`
  },

  SCHEMA_CHANGE: (metadata) => {
    if (!metadata?.summary) {
      return "Schema changed"
    }
    
    const { addedCount, removedCount, typeChangedCount } = metadata.summary
    const parts: string[] = []
    
    if (addedCount > 0) {
      parts.push(`${addedCount} column${addedCount === 1 ? "" : "s"} added`)
    }
    if (removedCount > 0) {
      parts.push(`${removedCount} column${removedCount === 1 ? "" : "s"} removed`)
    }
    if (typeChangedCount > 0) {
      parts.push(`${typeChangedCount} type${typeChangedCount === 1 ? "" : "s"} changed`)
    }
    
    if (parts.length === 0) {
      return "Schema changed"
    }
    
    return `Schema changed: ${parts.join(", ")}`
  },

  INTEGRATION_ERROR: (metadata) => {
    if (!metadata || !metadata.channel) {
      return "An integration error occurred"
    }
    return `Integration failure: ${metadata.channel} connection is faulty. ${metadata.error || ""}`
  },

  CUSTOM_METRIC_DROP: (metadata) => {
    if (!metadata) {
      return "Custom metric dropped significantly"
    }

    const metricName = metadata.metricName ?? "metric"
    const drop = metadata.dropPercentage !== undefined ? Math.round(metadata.dropPercentage) : undefined
    const current = metadata.current
    const baseline = metadata.baseline

    if (drop !== undefined && current !== undefined && baseline !== undefined) {
      return `${metricName} dropped ${drop}% (${formatMetricValue(current)} → was ${formatMetricValue(baseline)})`
    }

    if (drop !== undefined) {
      return `${metricName} dropped ${drop}%`
    }

    return `${metricName} dropped significantly`
  },

  CUSTOM_METRIC_DEGRADATION: (metadata) => {
    if (!metadata) {
      return "Custom metric shows declining trend"
    }

    const metricName = metadata.metricName ?? "metric"
    const decline = metadata.declinePercentage !== undefined ? Math.round(metadata.declinePercentage) : undefined
    const windowDays = metadata.windowDays
    const startValue = metadata.startValue
    const endValue = metadata.endValue

    if (decline !== undefined && windowDays !== undefined && startValue !== undefined && endValue !== undefined) {
      return `${metricName} declined ${decline}% over ${windowDays} days (${formatMetricValue(startValue)} → ${formatMetricValue(endValue)})`
    }

    if (decline !== undefined && windowDays !== undefined) {
      return `${metricName} declined ${decline}% over ${windowDays} days`
    }

    return `${metricName} shows declining trend`
  },
}

/**
 * Format a metric value for display
 * Handles both large numbers and small decimals
 */
function formatMetricValue(value: number): string {
  if (value >= 1000) {
    return value.toLocaleString()
  }
  if (value < 0.01 && value > 0) {
    return value.toExponential(2)
  }
  if (Number.isInteger(value)) {
    return value.toString()
  }
  return value.toFixed(2)
}

/**
 * Fallback generator for unknown alert types
 * Converts the type to a human-readable format
 */
function getFallbackPreview(alertType: string): string {
  return alertType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase()) + " detected"
}

/**
 * Get human-readable preview text for an alert
 * 
 * This is the main function to use throughout the app. It's type-safe
 * and will always return a meaningful string, even for unknown alert types.
 * 
 * @param alertType - The type of alert (from AlertType enum)
 * @param metadata - Optional metadata object containing alert-specific details
 * @returns Human-readable preview text describing what happened
 * 
 * @example
 * // ROW_COUNT_DROP with metadata
 * getAlertPreviewText("ROW_COUNT_DROP", { dropPercentage: 100, current: 1, baseline: 9865 })
 * // => "Row count dropped 100% (1 → was 9,865)"
 * 
 * @example
 * // NULL_OCCURRENCE with metadata
 * getAlertPreviewText("NULL_OCCURRENCE", { affectedColumns: [{ name: "email" }], columnCount: 1 })
 * // => "Null values appeared in column: email"
 * 
 * @example
 * // Unknown alert type
 * getAlertPreviewText("FUTURE_ALERT_TYPE", undefined)
 * // => "Future Alert Type detected"
 */
export function getAlertPreviewText(
  alertType: string | AlertType,
  metadata?: AlertMetadata | unknown
): string {
  const generator = ALERT_PREVIEW_GENERATORS[alertType as AlertType]
  
  if (generator) {
    return generator(metadata as AlertMetadata | undefined)
  }
  
  return getFallbackPreview(alertType)
}

/**
 * Check if an alert type has a dedicated preview generator
 * Useful for determining if custom preview logic exists
 */
export function hasAlertPreviewGenerator(alertType: string | AlertType): boolean {
  return alertType in ALERT_PREVIEW_GENERATORS
}

/**
 * Get the alert type display label (e.g., "ROW_COUNT_DROP" -> "Row Count Drop")
 * This is for displaying the type name, not the preview text
 */
export function getAlertTypeLabel(alertType: string | AlertType): string {
  return alertType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}
