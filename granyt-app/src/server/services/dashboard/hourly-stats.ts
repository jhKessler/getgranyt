import { DagRunStatus, AlertStatus, PrismaClient } from "@prisma/client";
import { subHours, startOfHour } from "date-fns";
import type { HourlyStat } from "./types";
import { getEnvironmentFilter } from "./helpers";
import { getDisplayStatus, DisplayStatus } from "../status-utils";

export async function getHourlyRunStats(
  prisma: PrismaClient,
  orgId: string,
  hours: number,
  environment?: string | null
): Promise<HourlyStat[]> {
  const now = new Date();
  const startDate = subHours(now, hours);
  const envFilter = getEnvironmentFilter(environment ?? null);

  const runs = await prisma.dagRun.findMany({
    where: {
      organizationId: orgId,
      startTime: { gte: startDate },
      dag: { disabled: false },
      environment: envFilter,
    },
    select: { 
      startTime: true, 
      status: true,
      _count: { select: { alerts: { where: { status: AlertStatus.OPEN } } } },
    },
  });

  const hourlyStats = initializeHourlyStats(now, hours);
  populateHourlyStats(hourlyStats, runs);

  return Object.values(hourlyStats);
}

function initializeHourlyStats(
  now: Date,
  hours: number
): Record<string, HourlyStat> {
  const stats: Record<string, HourlyStat> = {};

  for (let i = 0; i < hours; i++) {
    const hour = subHours(now, hours - 1 - i);
    const hourKey = startOfHour(hour).toISOString();
    stats[hourKey] = { hour: hourKey, success: 0, failed: 0 };
  }

  return stats;
}

function populateHourlyStats(
  stats: Record<string, HourlyStat>,
  runs: { startTime: Date; status: DagRunStatus; _count: { alerts: number } }[]
): void {
  for (const run of runs) {
    const hourKey = startOfHour(run.startTime).toISOString();

    if (!stats[hourKey]) {
      continue;
    }

    const displayStatus = getDisplayStatus(run.status, run._count.alerts);
    if (displayStatus === DisplayStatus.SUCCESS || displayStatus === DisplayStatus.WARNING) {
      stats[hourKey].success++;
    } else if (displayStatus === DisplayStatus.FAILED) {
      stats[hourKey].failed++;
    }
  }
}
