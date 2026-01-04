import { prisma } from "@/lib/prisma";
import type { OpenLineageEvent } from "@/lib/validators";

interface StoreRawLineageEventParams {
  organizationId: string;
  event: OpenLineageEvent;
  namespace: string;
  eventTime: Date;
}

/**
 * Stores the raw lineage event for auditing.
 */
export async function storeRawLineageEvent(
  params: StoreRawLineageEventParams
): Promise<void> {
  const { organizationId, event, namespace, eventTime } = params;

  await prisma.lineageEvent.create({
    data: {
      organizationId,
      eventType: event.eventType,
      jobName: event.job.name,
      jobNamespace: namespace,
      srcRunId: event.run.runId,
      eventTime,
      producer: event.producer,
      inputs: JSON.parse(JSON.stringify(event.inputs ?? [])),
      outputs: JSON.parse(JSON.stringify(event.outputs ?? [])),
      facets: JSON.parse(JSON.stringify(event.run.facets ?? {})),
      rawEvent: JSON.parse(JSON.stringify(event)),
    },
  });
}
