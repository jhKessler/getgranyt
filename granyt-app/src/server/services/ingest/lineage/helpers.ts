/**
 * Extracts DAG ID and task ID from job name.
 * Format: "dag_id" or "dag_id.task_id"
 */
export function extractDagInfo(
  jobName: string
): { srcDagId: string; srcTaskId?: string } {
  const parts = jobName.split(".");

  return {
    srcDagId: parts[0],
    srcTaskId: parts.length > 1 ? parts.slice(1).join(".") : undefined,
  };
}

/**
 * Checks if a string is a UUID format.
 */
export function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Extracts parent DAG run ID from facets.
 */
export function extractParentDagRunId(
  facets?: Record<string, unknown>
): string | undefined {
  const parent = facets?.parent as { run?: { runId?: string } } | undefined;
  return parent?.run?.runId;
}

/**
 * Extracts DAG schedule from job facets.
 */
export function extractDagSchedule(
  jobFacets?: Record<string, unknown>
): string | undefined {
  const airflowDag = jobFacets?.airflow_dag as { schedule_interval?: string } | undefined;
  return airflowDag?.schedule_interval;
}

/**
 * Determines run type from run ID format.
 */
export function inferRunType(srcRunId: string): "manual" | "scheduled" {
  return srcRunId.startsWith("manual__") ? "manual" : "scheduled";
}

/**
 * Calculates duration between two dates in seconds.
 */
export function calculateDuration(
  startTime: Date | null,
  endTime: Date
): number | null {
  if (!startTime) {
    return null;
  }

  return Math.round((endTime.getTime() - startTime.getTime()) / 1000);
}
