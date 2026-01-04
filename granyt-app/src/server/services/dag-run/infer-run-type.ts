/**
 * Determines the run type based on the run ID format.
 * Airflow run IDs typically have prefixes like:
 * - manual__ (manually triggered)
 * - scheduled__ (scheduled runs)
 * - backfill__ (backfill runs)
 * - dataset_triggered__ (triggered by dataset updates)
 */
export function inferRunType(srcRunId: string): "manual" | "scheduled" | "backfill" | "unknown" {
  if (srcRunId.startsWith("manual__")) return "manual";
  if (srcRunId.startsWith("scheduled__")) return "scheduled";
  if (srcRunId.startsWith("backfill__")) return "backfill";
  if (srcRunId.startsWith("dataset_triggered__")) return "scheduled";
  return "unknown";
}
