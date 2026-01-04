import { ensureDagExists, resolveNamespace } from "../../dag-run";
import { extractDagInfo, isUUID, extractDagSchedule } from "./helpers";
import { handleTaskLevelEvent } from "./handle-task-event";
import { handleDagLevelEvent } from "./handle-dag-event";
import { storeRawLineageEvent } from "./store-raw-event";
import type { IngestLineageParams, IngestLineageResult } from "./types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("LineageIngest");

/**
 * Ingests a lineage event into the database.
 */
export async function ingestLineage(
  params: IngestLineageParams
): Promise<IngestLineageResult> {
  const { organizationId, environment, event } = params;

  const { srcDagId, srcTaskId } = extractDagInfo(event.job.name);

  logger.debug(
    { organizationId, srcDagId, srcTaskId, eventType: event.eventType },
    "Ingesting lineage event"
  );

  const namespace = await resolveNamespace(
    organizationId,
    srcDagId,
    event.job.namespace || "airflow"
  );
  const eventTime = new Date(event.eventTime);
  const srcRunId = event.run.runId;

  const isTaskLevel = srcTaskId !== undefined && isUUID(srcRunId);

  const schedule = extractDagSchedule(event.job.facets as Record<string, unknown> | undefined);

  await ensureDagExists({
    organizationId,
    srcDagId,
    namespace,
    timestamp: eventTime,
    schedule,
  });

  if (isTaskLevel && srcTaskId) {
    await handleTaskLevelEvent({
      organizationId,
      environment,
      srcDagId,
      srcTaskId,
      namespace,
      srcRunId,
      eventType: event.eventType,
      eventTime,
      facets: event.run.facets as Record<string, unknown> | undefined,
    });
  } else {
    await handleDagLevelEvent({
      organizationId,
      environment,
      srcDagId,
      namespace,
      srcRunId,
      eventType: event.eventType,
      eventTime,
      schedule,
    });
  }

  await storeRawLineageEvent({ organizationId, event, namespace, eventTime });

  return {
    eventType: event.eventType,
    isTaskLevel,
    srcDagId,
    srcTaskId,
  };
}
