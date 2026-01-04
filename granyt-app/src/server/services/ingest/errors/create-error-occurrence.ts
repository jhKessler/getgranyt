import { prisma } from "@/lib/prisma";
import type { ErrorEvent } from "@/lib/validators";

interface CreateErrorOccurrenceParams {
  organizationId: string;
  generalErrorId: string;
  taskRunId: string;
  event: ErrorEvent;
  timestamp: Date;
}

/**
 * Creates an ErrorOccurrence record.
 */
export async function createErrorOccurrence(
  params: CreateErrorOccurrenceParams
): Promise<void> {
  const { organizationId, generalErrorId, taskRunId, event, timestamp } = params;

  await prisma.errorOccurrence.create({
    data: {
      organizationId,
      generalErrorId,
      taskRunId,
      errorId: event.error_id,
      operator: event.task_instance?.operator ?? undefined,
      tryNumber: event.task_instance?.try_number ?? undefined,
      stacktrace: event.stacktrace
        ? JSON.parse(JSON.stringify(event.stacktrace))
        : undefined,
      systemInfo: event.system
        ? JSON.parse(JSON.stringify(event.system))
        : undefined,
      sdkVersion: event.sdk_version ?? null,
      timestamp,
    },
  });
}
