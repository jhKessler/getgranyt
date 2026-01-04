import { PrismaClient, DagRunStatus } from "@prisma/client";
import type { OverviewMetrics } from "./types";
import { getEnvironmentFilter } from "./helpers";

export async function getOverviewMetrics(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date | null,
  environment?: string | null
): Promise<OverviewMetrics> {
  const envFilter = getEnvironmentFilter(environment ?? null);

  const [activeDags, totalRuns, failedRuns, totalDuration] = await Promise.all([
    countActiveDags(prisma, orgId, startDate, envFilter),
    countTotalRuns(prisma, orgId, startDate, envFilter),
    countFailedRuns(prisma, orgId, startDate, envFilter),
    sumTotalDuration(prisma, orgId, startDate, envFilter),
  ]);

  return { activeDags, totalRuns, failedRuns, totalDuration };
}

async function countActiveDags(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date | null,
  envFilter?: string
): Promise<number> {
  const uniqueDags = await prisma.dagRun.findMany({
    where: {
      organizationId: orgId,
      ...(startDate && { startTime: { gte: startDate } }),
      dag: { disabled: false },
      environment: envFilter,
    },
    select: { srcDagId: true },
    distinct: ["srcDagId"],
  });

  return uniqueDags.length;
}

async function countTotalRuns(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date | null,
  envFilter?: string
): Promise<number> {
  return prisma.dagRun.count({
    where: {
      organizationId: orgId,
      ...(startDate && { startTime: { gte: startDate } }),
      dag: { disabled: false },
      environment: envFilter,
    },
  });
}

async function countFailedRuns(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date | null,
  envFilter?: string
): Promise<number> {
  return prisma.dagRun.count({
    where: {
      organizationId: orgId,
      ...(startDate && { startTime: { gte: startDate } }),
      status: DagRunStatus.FAILED,
      dag: { disabled: false },
      environment: envFilter,
    },
  });
}

async function sumTotalDuration(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date | null,
  envFilter?: string
): Promise<number> {
  const result = await prisma.dagRun.aggregate({
    where: {
      organizationId: orgId,
      ...(startDate && { startTime: { gte: startDate } }),
      dag: { disabled: false },
      environment: envFilter,
    },
    _sum: { duration: true },
  });

  return result._sum.duration ?? 0;
}
