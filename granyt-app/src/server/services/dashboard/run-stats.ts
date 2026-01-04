import { PrismaClient, DagRunStatus, AlertStatus } from "@prisma/client";
import { getDisplayStatus, DisplayStatus } from "../status-utils";

interface RunStats {
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  successRate: number;
  avgDuration: number | null;
}

interface RunWithStatus {
  id: string;
  duration: number | null;
  status: DagRunStatus;
  _count: { alerts: number };
}

export async function getDagRuns(
  prisma: PrismaClient,
  orgId: string,
  srcDagId: string,
  namespace: string,
  startDate: Date | null,
  envFilter?: string
) {
  return prisma.dagRun.findMany({
    where: {
      organizationId: orgId,
      srcDagId,
      namespace,
      ...(startDate && { startTime: { gte: startDate } }),
      environment: envFilter,
    },
    orderBy: { startTime: "desc" },
    include: {
      _count: { select: { alerts: { where: { status: AlertStatus.OPEN } } } },
    },
  });
}

export function calculateRunStats(runs: RunWithStatus[]): RunStats {
  const totalRuns = runs.length;
  const successRuns = runs.filter((r) => {
    const displayStatus = getDisplayStatus(r.status, r._count.alerts);
    return displayStatus === DisplayStatus.SUCCESS || displayStatus === DisplayStatus.WARNING;
  }).length;
  const failedRuns = runs.filter((r) => {
    const displayStatus = getDisplayStatus(r.status, r._count.alerts);
    return displayStatus === DisplayStatus.FAILED;
  }).length;
  const successRate = totalRuns > 0 ? (successRuns / totalRuns) * 100 : 0;

  const durations = runs
    .filter((r) => r.duration !== null)
    .map((r) => r.duration!);

  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

  return { totalRuns, successRuns, failedRuns, successRate, avgDuration };
}

export function getUniqueEnvironments(runs: { environment: string | null }[]): string[] {
  const envs = new Set<string>();
  for (const run of runs) {
    if (run.environment) {
      envs.add(run.environment);
    }
  }
  return Array.from(envs);
}
