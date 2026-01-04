import { prisma } from "@/lib/prisma";
import type { FindOrCreateTaskRunParams } from "./types";

/**
 * Finds or creates a TaskRun record.
 */
export async function findOrCreateTaskRun(
  params: FindOrCreateTaskRunParams
): Promise<{ id: string }> {
  const { organizationId, dagRunId, srcTaskId, operator, environment } = params;

  const taskRun = await prisma.taskRun.upsert({
    where: {
      dagRunId_srcTaskId: {
        dagRunId,
        srcTaskId,
      },
    },
    create: {
      organizationId,
      dagRunId,
      srcTaskId,
      status: "running",
      operator: operator ?? null,
      environment,
    },
    update: {
      operator: operator ?? undefined,
      // Update environment if not set and we have one now
      environment: environment ?? undefined,
    },
  });

  return { id: taskRun.id };
}
