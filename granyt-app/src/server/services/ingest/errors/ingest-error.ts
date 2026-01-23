import { resolveDagContext, inferRunType } from "../../dag-run";
import { generateErrorFingerprint } from "./fingerprint";
import { upsertGeneralError } from "./upsert-general-error";
import { createErrorOccurrence } from "./create-error-occurrence";
import { notify, NotificationEventType } from "../../notifications";
import type { IngestErrorParams, IngestErrorResult } from "./types";
import { createLogger } from "@/lib/logger";
import { env } from "@/env";

const logger = createLogger("ErrorIngest");

/**
 * Ingests an error event into the database.
 */
export async function ingestError(
  params: IngestErrorParams
): Promise<IngestErrorResult> {
  const { organizationId, environment, event } = params;
  const timestamp = new Date(event.timestamp);

  const { srcDagId, srcTaskId, srcRunId, operator } = extractTaskInstance(event);

  logger.debug(
    { organizationId, srcDagId, srcTaskId, srcRunId, exceptionType: event.exception.type },
    "Ingesting error event"
  );

  const taskRunId = await resolveDagContext({
    organizationId,
    environment,
    srcDagId,
    srcTaskId,
    srcRunId,
    namespace: "airflow",
    timestamp,
    operator,
  });

  const fingerprint = generateErrorFingerprint(
    event.exception.type,
    event.exception.message,
    event.stacktrace
  );

  const { id: generalErrorId, isNew: isNewError } = await upsertGeneralError({
    organizationId,
    fingerprint,
    exceptionType: event.exception.type,
    message: event.exception.message,
    timestamp,
  });

  await createErrorOccurrence({
    organizationId,
    generalErrorId,
    taskRunId,
    event,
    timestamp,
  });

  // Format stack trace from the stacktrace frames if available
  const formattedStackTrace = event.stacktrace
    ?.map((frame) => `  File "${frame.filename}", line ${frame.lineno}, in ${frame.function}`)
    .join("\n");

  // Infer run type from the run ID for notification filtering
  const runType = inferRunType(srcRunId);

  // Send notification asynchronously (don't block error ingestion)
  notify({
    organizationId,
    type: isNewError
      ? NotificationEventType.NEW_PIPELINE_ERROR
      : NotificationEventType.PIPELINE_ERROR,
    severity: "critical",
    errorType: event.exception.type,
    errorMessage: event.exception.message,
    dagId: srcDagId,
    taskId: srcTaskId,
    runId: srcRunId,
    stackTrace: formattedStackTrace,
    isNewError,
    environment,
    runType,
    dashboardUrl: env.NEXT_PUBLIC_APP_URL
      ? `${env.NEXT_PUBLIC_APP_URL}/dashboard/errors`
      : undefined,
  }).catch((err) => {
    logger.error({ error: err, organizationId }, "Failed to send error notification");
  });

  return {
    errorId: event.error_id,
    generalErrorId,
    taskRunId,
  };
}

function extractTaskInstance(event: IngestErrorParams["event"]) {
  const srcDagId = event.task_instance?.dag_id;
  const srcTaskId = event.task_instance?.task_id;
  const srcRunId = event.task_instance?.run_id;
  const operator = event.task_instance?.operator;

  if (!srcDagId || !srcTaskId || !srcRunId) {
    throw new Error(
      "Missing task_instance: dag_id, task_id, and run_id are required"
    );
  }

  return { srcDagId, srcTaskId, srcRunId, operator };
}

/**
 * Ingests multiple error events into the database.
 */
export async function ingestErrors(
  organizationId: string,
  events: IngestErrorParams["event"][],
  environment?: string | null
): Promise<IngestErrorResult[]> {
  logger.debug(
    { organizationId, count: events.length },
    "Ingesting multiple error events"
  );
  const results: IngestErrorResult[] = [];

  for (const event of events) {
    const result = await ingestError({ organizationId, environment, event });
    results.push(result);
  }

  return results;
}
