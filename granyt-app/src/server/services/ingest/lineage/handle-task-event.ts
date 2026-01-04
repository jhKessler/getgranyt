import { prisma } from "@/lib/prisma";
import { ensureDagExists, findOrCreateDagRun } from "../../dag-run";
import { extractParentDagRunId, calculateDuration } from "./helpers";
import type { TaskLevelEventParams } from "./types";

/**
 * Handles task-level lineage events.
 */
export async function handleTaskLevelEvent(
  params: TaskLevelEventParams
): Promise<void> {
  const {
    organizationId,
    environment,
    srcDagId,
    srcTaskId,
    namespace,
    srcRunId,
    eventType,
    eventTime,
    facets,
  } = params;

  const parentDagRunId = extractParentDagRunId(facets);

  if (!parentDagRunId) {
    return;
  }

  await ensureDagExists({
    organizationId,
    srcDagId,
    namespace,
    timestamp: eventTime,
  });

  const dagRun = await findOrCreateDagRun({
    organizationId,
    srcDagId,
    srcRunId: parentDagRunId,
    namespace,
    timestamp: eventTime,
    environment,
  });

  await upsertTaskRun({
    organizationId,
    dagRunId: dagRun.id,
    srcTaskId,
    srcRunId,
    eventType,
    eventTime,
    facets,
    environment,
  });
}

async function upsertTaskRun(params: {
  organizationId: string;
  dagRunId: string;
  srcTaskId: string;
  srcRunId: string;
  eventType: string;
  eventTime: Date;
  facets?: Record<string, unknown>;
  environment?: string | null;
}): Promise<void> {
  const { organizationId, dagRunId, srcTaskId, srcRunId, eventType, eventTime, facets, environment } =
    params;

  const whereClause = {
    dagRunId_srcTaskId: {
      dagRunId,
      srcTaskId,
    },
  };

  const baseData = {
    organizationId,
    dagRunId,
    srcTaskId,
    srcRunId,
    environment,
  };

  if (eventType === "START") {
    await prisma.taskRun.upsert({
      where: whereClause,
      create: { ...baseData, status: "running", startTime: eventTime },
      update: { srcRunId, status: "running", startTime: eventTime, environment: environment ?? undefined },
    });
    return;
  }

  if (eventType === "COMPLETE") {
    const existing = await prisma.taskRun.findUnique({ where: whereClause });
    const duration = calculateDuration(existing?.startTime ?? null, eventTime);

    await prisma.taskRun.upsert({
      where: whereClause,
      create: { ...baseData, status: "success", startTime: eventTime, endTime: eventTime },
      update: { srcRunId, status: "success", endTime: eventTime, duration, environment: environment ?? undefined },
    });
    return;
  }

  if (eventType === "FAIL" || eventType === "ABORT") {
    const existing = await prisma.taskRun.findUnique({ where: whereClause });
    const duration = calculateDuration(existing?.startTime ?? null, eventTime);
    const errorFacet = facets?.errorMessage as { message?: string } | undefined;

    await prisma.taskRun.upsert({
      where: whereClause,
      create: {
        ...baseData,
        status: "failed",
        startTime: eventTime,
        endTime: eventTime,
        errorMessage: errorFacet?.message,
      },
      update: {
        srcRunId,
        status: "failed",
        endTime: eventTime,
        duration,
        errorMessage: errorFacet?.message,
        environment: environment ?? undefined,
      },
    });
  }
}
