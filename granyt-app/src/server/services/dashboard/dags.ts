import { AlertStatus, PrismaClient, Dag, DagRun } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { getDagRuns, calculateRunStats, getUniqueEnvironments } from "./run-stats";
import type { DagOverview, DagStats, EnvironmentStatus } from "./types";
import { RunStatusFilter } from "./types";
import { getEnvironmentFilter } from "./helpers";
import { dagRunStatusToString } from "../status-utils";

export async function getDagsOverview(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date | null,
  search?: string,
  statusFilter?: RunStatusFilter,
  environment?: string | null
): Promise<DagOverview[]> {
  const envFilter = getEnvironmentFilter(environment ?? null);

  const dags = await prisma.dag.findMany({
    where: {
      organizationId: orgId,
      disabled: false,
      ...(search && { srcDagId: { contains: search, mode: "insensitive" } }),
    },
    orderBy: { srcDagId: "asc" },
  });

  const dagsWithStats = await Promise.all(
    dags.map((dag) => buildDagOverview(prisma, orgId, dag, startDate, envFilter))
  );

  // Filter out DAGs with no runs in the selected environment
  const filteredDags = environment 
    ? dagsWithStats.filter((d) => d.totalRuns > 0)
    : dagsWithStats;

  return filterByStatus(filteredDags, statusFilter);
}

async function buildDagOverview(
  prisma: PrismaClient,
  orgId: string,
  dag: Dag,
  startDate: Date | null,
  envFilter?: string
): Promise<DagOverview> {
  const runs = await getDagRuns(prisma, orgId, dag.srcDagId, dag.namespace, startDate, envFilter);
  const stats = calculateRunStats(runs);
  const environments = getUniqueEnvironments(runs);

  const lastRun = runs[0];
  const lastStatus = lastRun 
    ? dagRunStatusToString(lastRun.status)
    : null;

  return {
    id: dag.id,
    dagId: dag.srcDagId,
    namespace: dag.namespace,
    schedule: dag.schedule,
    lastStatus,
    lastRunTime: lastRun?.startTime ?? null,
    lastRunId: lastRun?.id ?? null,
    successRate: stats.successRate,
    avgDuration: stats.avgDuration,
    totalRuns: stats.totalRuns,
    failedRuns: stats.failedRuns,
    environments,
  };
}

function filterByStatus(dags: DagOverview[], status?: RunStatusFilter): DagOverview[] {
  if (status === RunStatusFilter.Success) {
    return dags.filter((d) => d.lastStatus === "success");
  }

  if (status === RunStatusFilter.Failed) {
    return dags.filter((d) => d.lastStatus === "failed");
  }

  return dags;
}

export async function getDagDetails(
  prisma: PrismaClient,
  orgId: string,
  dagId: string,
  startDate: Date | null,
  environment?: string | null
) {
  const dag = await prisma.dag.findFirst({
    where: { organizationId: orgId, srcDagId: dagId, disabled: false },
    orderBy: { lastSeenAt: "desc" },
  });

  if (!dag) {
    throw new TRPCError({ code: "NOT_FOUND", message: "DAG not found" });
  }

  const envFilter = getEnvironmentFilter(environment ?? null);

  const runs = await getDagRuns(prisma, orgId, dag.srcDagId, dag.namespace, startDate, envFilter);
  const stats = calculateFullDagStats(runs);
  const errors = await getDagErrors(prisma, orgId, dag.srcDagId, envFilter);
  const environments = getUniqueEnvironments(runs);

  return {
    dag,
    stats,
    errors,
    environments,
  };
}

export async function getDagEnvironmentStatuses(
  prisma: PrismaClient,
  orgId: string,
  dagId: string,
  startDate: Date | null
): Promise<EnvironmentStatus[]> {
  const dag = await prisma.dag.findFirst({
    where: { organizationId: orgId, srcDagId: dagId, disabled: false },
    orderBy: { lastSeenAt: "desc" },
  });

  if (!dag) {
    return [];
  }

  // Get all runs with their environments
  const runs = await prisma.dagRun.findMany({
    where: {
      organizationId: orgId,
      srcDagId: dag.srcDagId,
      namespace: dag.namespace,
      ...(startDate && { startTime: { gte: startDate } }),
    },
    include: {
      _count: { select: { alerts: { where: { status: AlertStatus.OPEN } } } },
    },
    orderBy: { startTime: "desc" },
  });

  // Group by environment
  const envMap = new Map<string, { runs: DagRun[]; lastRun: DagRun | null }>();

  for (const run of runs) {
    const env = run.environment ?? "unknown";
    if (!envMap.has(env)) {
      envMap.set(env, { runs: [], lastRun: null });
    }
    const envData = envMap.get(env)!;
    envData.runs.push(run as unknown as DagRun);
    if (!envData.lastRun) {
      envData.lastRun = run as unknown as DagRun;
    }
  }

  const results: EnvironmentStatus[] = [];

  for (const [env, data] of envMap.entries()) {
    const openErrorCount = await prisma.generalError.count({
      where: {
        organizationId: orgId,
        status: "open",
        occurrences: {
          some: {
            taskRun: {
              environment: env,
              dagRun: { srcDagId: dag.srcDagId },
            },
          },
        },
      },
    });

    const openAlertCount = await prisma.alert.count({
      where: {
        organizationId: orgId,
        srcDagId: dag.srcDagId,
        status: AlertStatus.OPEN,
        dagRun: { environment: env },
      },
    });

    results.push({
      environment: env,
      lastStatus: data.lastRun 
        ? dagRunStatusToString(data.lastRun.status)
        : null,
      lastRunTime: data.lastRun?.startTime ?? null,
      openErrorCount,
      openAlertCount,
    });
  }

  return results;
}

function calculateFullDagStats(runs: (DagRun & { _count: { alerts: number } })[]): DagStats {
  return calculateRunStats(runs);
}

async function getDagErrors(
  prisma: PrismaClient, 
  orgId: string, 
  srcDagId: string,
  envFilter?: string
) {
  const envCondition = envFilter ? { environment: envFilter } : {};

  const errors = await prisma.generalError.findMany({
    where: {
      organizationId: orgId,
      status: "open",
      occurrences: {
        some: { 
          taskRun: { 
            ...envCondition,
            dagRun: { srcDagId },
          } 
        },
      },
    },
    include: {
      occurrences: {
        where: { 
          taskRun: { 
            ...envCondition,
            dagRun: { srcDagId },
          } 
        },
        orderBy: { timestamp: "desc" },
        take: 1,
      },
      _count: {
        select: {
          occurrences: { 
            where: { 
              taskRun: { 
                ...envCondition,
                dagRun: { srcDagId },
              } 
            } 
          },
        },
      },
    },
    orderBy: { lastSeenAt: "desc" },
  });

  return errors.map((e) => ({
    id: e.id,
    exceptionType: e.exceptionType,
    message: e.message,
    occurrenceCount: e._count.occurrences,
    lastSeenAt: e.occurrences[0]?.timestamp || e.lastSeenAt,
  }));
}
