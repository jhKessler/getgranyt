import { AlertType, AlertDetector } from "../types";
import { rowCountDropDetector } from "./row-count-drop/index";
import { nullOccurrenceDetector } from "./null-occurrence";
import { schemaChangeDetector } from "./schema-change";

/**
 * Registry of all alert detectors.
 * Add new detectors here as they are implemented.
 */
export const detectorRegistry: Map<AlertType, AlertDetector> = new Map([
  [AlertType.ROW_COUNT_DROP, rowCountDropDetector],
  [AlertType.NULL_OCCURRENCE, nullOccurrenceDetector],
  [AlertType.SCHEMA_CHANGE, schemaChangeDetector],
  // Future detectors:
  // [AlertType.SLOW_DEGRADATION, slowDegradationDetector],
  // [AlertType.ERROR_SPIKE, errorSpikeDetector],
]);

/**
 * Get all registered detectors
 */
export function getAllDetectors(): AlertDetector[] {
  return Array.from(detectorRegistry.values());
}

/**
 * Get a specific detector by type
 */
export function getDetector(type: AlertType): AlertDetector | undefined {
  return detectorRegistry.get(type);
}
