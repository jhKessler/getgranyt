// Auth
export { extractApiKey, validateApiKey, type AuthResult } from "./auth";

// Payload parsing
export { parsePayload, parseArrayPayload, type ParseResult } from "./payload";

// DAG/Task management
export {
  ensureDagExists,
  findOrCreateDagRun,
  findOrCreateTaskRun,
  resolveDagContext,
} from "./dag-run";

// Ingestion services
export { ingestMetrics } from "./ingest";
export { ingestError, ingestErrors } from "./ingest";
export { ingestLineage } from "./ingest";

// Dashboard services
export * from "./dashboard";

// Organization services
export * from "./organization";

// Alert services
export {
  // Types
  AlertType,
  AlertStatus,
  AlertSensitivity,
  type DetectorContext,
  type DetectionResult,
  type EffectiveAlertSettings,
  type AlertDetector,
  type CreateAlertInput,
  // Detectors
  detectorRegistry,
  getAllDetectors,
  getDetector,
  // Engine
  scheduleAlertEvaluation,
  processAlertEvaluation,
  getEffectiveSettings,
  reduceDagSensitivity,
  setDagSensitivity,
  // Mutations
  acknowledgeAlert,
  dismissAlert,
  autoResolveAlert,
  reopenAlert,
  type DismissReason,
  // Queries
  getAlerts,
  getAlertById,
  countOpenAlerts,
  getAlertsSummary,
  type GetAlertsParams,
  type AlertWithContext,
} from "./alerts";
