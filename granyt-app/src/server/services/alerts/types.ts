import { AlertType, AlertStatus, AlertSensitivity } from "@prisma/client";

// ============================================================================
// Detector Context - data passed to all detectors
// ============================================================================

export interface DetectorContext {
  organizationId: string;
  srcDagId: string;
  captureId: string | null;
  dagRunId: string;
  taskRunId: string | null;
  environment: string | null;

  // Metric data (from Metric JSON)
  rowCount?: number | null;
  columnCount?: number | null;
  columns?: ColumnInfo[] | null;
  memoryBytes?: number | null;

  // DAG-level data
  dagDuration?: number | null;
  dagStatus?: string | null;
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  null_count: number | null;
  empty_string_count: number | null;
}

// ============================================================================
// Detection Result
// ============================================================================

export interface DetectionResult {
  shouldAlert: boolean;
  severity: "warning" | "critical";
  metadata: Record<string, unknown>;
}

// ============================================================================
// Effective Settings (after merging org + DAG overrides)
// ============================================================================

export interface EffectiveAlertSettings {
  enabled: boolean;
  sensitivity: AlertSensitivity;
  customThreshold: number | null; // Custom percentage (1-100), only used when sensitivity=CUSTOM
}

// ============================================================================
// Detector Interface - all detectors must implement this
// ============================================================================

export interface AlertDetector {
  type: AlertType;
  detect(
    ctx: DetectorContext,
    settings: EffectiveAlertSettings
  ): Promise<DetectionResult | null>;
}

// ============================================================================
// Alert Creation Input
// ============================================================================

export interface CreateAlertInput {
  organizationId: string;
  alertType: AlertType;
  severity: "warning" | "critical";
  srcDagId?: string;
  captureId?: string | null;
  dagRunId?: string;
  taskRunId?: string | null;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Re-export enums for convenience
// ============================================================================

export { AlertType, AlertStatus, AlertSensitivity };

/**
 * Returns true if the alert type only supports enable/disable (no sensitivity levels)
 */
export function isBinaryAlert(type: AlertType | string): boolean {
  return type === AlertType.SCHEMA_CHANGE || type === AlertType.NULL_OCCURRENCE;
}
