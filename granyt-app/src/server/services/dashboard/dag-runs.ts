import { DagRunStatus, AlertStatus, PrismaClient, DagRun } from "@prisma/client";
import type { RunWithMetrics, AllDagRunsItem } from "./types";
import { RunStatusFilter } from "./types";
import { getEnvironmentFilter } from "./helpers";
import { dagRunStatusToString } from "../status-utils";

type DagRunListItem = DagRun & {
  dag: { schedule: string | null } | null;
  _count: { taskRuns: number; alerts: number };
};

/** Convert status filter to DagRunStatus values for querying */
function getStatusFilter(status?: RunStatusFilter): DagRunStatus[] | undefined {
  if (!status || status === RunStatusFilter.All) return undefined;
  // For "success" filter, we include SUCCESS status (WARNING is computed dynamically)
  if (status === RunStatusFilter.Success) return [DagRunStatus.SUCCESS];
  if (status === RunStatusFilter.Failed) return [DagRunStatus.FAILED];
  return undefined;
}

export async function getAllDagRuns(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date | null,
  endDate: Date | null,
  limit: number,
  search?: string,
  status?: RunStatusFilter,
  runType?: "manual" | "scheduled" | "backfill",
  environment?: string | null
): Promise<AllDagRunsItem[]> {
  const envFilter = getEnvironmentFilter(environment ?? null);
  const statusFilter = getStatusFilter(status);

  // Build time filter based on provided dates
  const timeFilter = startDate && endDate
    ? { gte: startDate, lt: endDate }
    : startDate
    ? { gte: startDate }
    : undefined;

  const runs = await prisma.dagRun.findMany({
    where: {
      organizationId: orgId,
      ...(timeFilter && { startTime: timeFilter }),
      dag: { disabled: false },
      environment: envFilter,
      ...(search && {
        srcDagId: { contains: search, mode: "insensitive" as const },
      }),
      ...(statusFilter && { status: { in: statusFilter } }),
      ...(runType && { runType }),
    },
    orderBy: { startTime: "desc" },
    take: limit,
    include: {
      dag: {
        select: {
          schedule: true,
        },
      },
      _count: {
        select: {
          taskRuns: true,
          alerts: { where: { status: AlertStatus.OPEN } },
        },
      },
    },
  });

  return Promise.all(runs.map((run) => buildAllDagRunsItem(prisma, orgId, run)));
}

async function buildAllDagRunsItem(
  prisma: PrismaClient,
  orgId: string,
  run: DagRunListItem
): Promise<AllDagRunsItem> {
  const errorCount = await prisma.errorOccurrence.count({
    where: {
      taskRun: { dagRunId: run.id },
    },
  });

  return {
    id: run.id,
    srcDagId: run.srcDagId,
    srcRunId: run.srcRunId,
    status: dagRunStatusToString(run.status),
    startTime: run.startTime,
    endTime: run.endTime,
    duration: run.duration,
    runType: run.runType,
    environment: run.environment,
    taskCount: run._count.taskRuns,
    errorCount,
    schedule: run.dag?.schedule ?? null,
  };
}

export async function getDagRunsWithMetrics(
  prisma: PrismaClient,
  orgId: string,
  dagId: string,
  startDate: Date | null,
  limit: number,
  environment?: string | null
): Promise<RunWithMetrics[]> {
  const envFilter = getEnvironmentFilter(environment ?? null);

  const runs = await prisma.dagRun.findMany({
    where: {
      organizationId: orgId,
      srcDagId: dagId,
      ...(startDate && { startTime: { gte: startDate } }),
      dag: { disabled: false },
      environment: envFilter,
    },
    orderBy: { startTime: "desc" },
    take: limit,
    include: {
      _count: { select: { alerts: { where: { status: AlertStatus.OPEN } } } },
    },
  });

  return Promise.all(runs.map((run) => buildRunWithMetrics(run)));
}

function buildRunWithMetrics(run: DagRun): RunWithMetrics {
  return {
    id: run.id,
    runId: run.srcRunId,
    status: dagRunStatusToString(run.status),
    startTime: run.startTime,
    endTime: run.endTime,
    duration: run.duration,
    runType: run.runType,
    environment: run.environment,
  };
}
