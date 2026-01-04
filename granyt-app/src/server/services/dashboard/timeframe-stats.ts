import { DagRunStatus, AlertStatus, PrismaClient } from "@prisma/client";
import { subHours, subDays, startOfHour, startOfDay, eachHourOfInterval, eachDayOfInterval } from "date-fns";
import { getEnvironmentFilter } from "./helpers";
import { getDisplayStatus, DisplayStatus } from "../status-utils";
import { Timeframe } from "./types";

export interface TimeframeStat {
  date: string;
  success: number;
  failed: number;
  manual: number;
  scheduled: number;
}

export type GroupBy = "hour" | "day";

export function getGroupByForTimeframe(timeframe: Timeframe): GroupBy {
  return timeframe === Timeframe.Day ? "hour" : "day";
}

export async function getTimeframeRunStats(
  prisma: PrismaClient,
  orgId: string,
  timeframe: Timeframe,
  environment?: string | null
): Promise<TimeframeStat[]> {
  const groupBy = getGroupByForTimeframe(timeframe);
  const { startDate } = getTimeframeBounds(timeframe);
  const envFilter = getEnvironmentFilter(environment ?? null);

  const runs = await prisma.dagRun.findMany({
    where: {
      organizationId: orgId,
      ...(startDate && { startTime: { gte: startDate } }),
      dag: { disabled: false },
      environment: envFilter,
    },
    select: {
      id: true,
      startTime: true,
      status: true,
      runType: true,
      _count: { select: { alerts: { where: { status: AlertStatus.OPEN } } } },
    },
  });

  const stats = initializeStats(startDate, groupBy);
  populateStats(stats, runs, groupBy);

  return Object.values(stats).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function getTimeframeBounds(timeframe: Timeframe): { startDate: Date | null } {
  const now = new Date();

  switch (timeframe) {
    case Timeframe.Day:
      return { startDate: subHours(now, 24) };
    case Timeframe.Week:
      return { startDate: subDays(now, 7) };
    case Timeframe.Month:
      return { startDate: subDays(now, 28) };
    case Timeframe.AllTime:
      return { startDate: null };
  }
}

function initializeStats(
  startDate: Date | null,
  groupBy: GroupBy
): Record<string, TimeframeStat> {
  const stats: Record<string, TimeframeStat> = {};

  // For "all time", we don't pre-initialize slots - we'll just aggregate what we find
  if (!startDate) {
    return stats;
  }

  const now = new Date();

  if (groupBy === "hour") {
    const hours = eachHourOfInterval({ start: startDate, end: now });
    for (const hour of hours) {
      const key = startOfHour(hour).toISOString();
      stats[key] = { date: key, success: 0, failed: 0, manual: 0, scheduled: 0 };
    }
  } else {
    const days = eachDayOfInterval({ start: startDate, end: now });
    for (const day of days) {
      const key = startOfDay(day).toISOString();
      stats[key] = { date: key, success: 0, failed: 0, manual: 0, scheduled: 0 };
    }
  }

  return stats;
}

function populateStats(
  stats: Record<string, TimeframeStat>,
  runs: { id: string; startTime: Date; status: DagRunStatus; runType: string | null; _count: { alerts: number } }[],
  groupBy: GroupBy
): void {
  for (const run of runs) {
    const slotKey = groupBy === "hour"
      ? startOfHour(run.startTime).toISOString()
      : startOfDay(run.startTime).toISOString();

    // Create slot if it doesn't exist (for all-time queries)
    if (!stats[slotKey]) {
      stats[slotKey] = { date: slotKey, success: 0, failed: 0, manual: 0, scheduled: 0 };
    }

    const displayStatus = getDisplayStatus(run.status, run._count.alerts);
    if (displayStatus === DisplayStatus.SUCCESS || displayStatus === DisplayStatus.WARNING) {
      stats[slotKey].success++;
    } else if (displayStatus === DisplayStatus.FAILED) {
      stats[slotKey].failed++;
    }

    // Track run type (manual vs scheduled)
    const runType = run.runType?.toLowerCase();
    if (runType === "manual") {
      stats[slotKey].manual++;
    } else if (runType === "scheduled" || runType === "schedule") {
      stats[slotKey].scheduled++;
    }
  }
}
