import { ensureDagExists } from "./ensure-dag-exists";
import { findOrCreateDagRun } from "./find-or-create-dag-run";
import { findOrCreateTaskRun } from "./find-or-create-task-run";
import { resolveNamespace } from "./resolve-namespace";
import type { DagContext } from "./types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("DagContextResolver");

/**
 * Resolves the full DAG context including DagRun and TaskRun IDs.
 * Creates records as needed if they don't exist.
 * Throws if insufficient context is provided.
 */
export async function resolveDagContext(ctx: DagContext): Promise<string> {
  const {
    organizationId,
    environment,
    srcDagId,
    srcTaskId,
    srcRunId,
    timestamp,
    operator,
  } = ctx;

  logger.debug(
    { organizationId, srcDagId, srcTaskId, srcRunId },
    "Resolving DAG context"
  );
  
  // Resolve namespace - if "airflow" is provided, try to find a better one
  const namespace = await resolveNamespace(
    organizationId,
    srcDagId,
    ctx.namespace ?? "airflow"
  );

  if (!srcRunId || !srcTaskId || !srcDagId) {
    throw new Error(
      "Insufficient DAG context: dag_id, task_id, and run_id are required"
    );
  }

  await ensureDagExists({
    organizationId,
    srcDagId,
    namespace,
    timestamp,
  });

  const dagRun = await findOrCreateDagRun({
    organizationId,
    srcDagId,
    srcRunId,
    namespace,
    timestamp,
    environment,
  });

  const taskRun = await findOrCreateTaskRun({
    organizationId,
    dagRunId: dagRun.id,
    srcTaskId,
    operator,
    environment,
  });

  return taskRun.id;
}
