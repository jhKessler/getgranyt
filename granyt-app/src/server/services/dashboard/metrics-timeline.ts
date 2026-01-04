import { AlertStatus, PrismaClient } from "@prisma/client";
import { getEnvironmentFilter } from "./helpers";
import { 
  parseMetricsJson, 
  type ColumnMetricDb 
} from "@/lib/json-schemas";
import { getDisplayStatus, displayStatusToString } from "../status-utils";

/**
 * Column metrics from a capture
 */
export type ColumnMetric = ColumnMetricDb;

/**
 * A single capture point with all its metrics
 */
export interface CapturePoint {
  id: string;
  captureId: string;
  taskId: string;
  metrics: Record<string, unknown>; // All metrics as flexible JSON
  capturedAt: string;
}

/**
 * Metrics for a single DAG run
 */
export interface RunMetrics {
  runId: string;
  srcRunId: string;
  startTime: string;
  status: string;
  captures: CapturePoint[];
}

/**
 * Aggregated capture data across runs for timeline view
 */
export interface CaptureTimeline {
  captureId: string;
  taskId: string;
  dataPoints: Array<{
    runId: string;
    srcRunId: string;
    startTime: string;
    metrics: Record<string, unknown>;
    capturedAt: string;
  }>;
}

/**
 * Get metrics timeline for a specific DAG.
 * Returns data grouped by capture ID with historical data points.
 */
export async function getMetricsTimeline(
  prisma: PrismaClient,
  orgId: string,
  dagId: string,
  startDate: Date | null,
  environment?: string | null,
  limit: number = 50
): Promise<CaptureTimeline[]> {
  const envFilter = getEnvironmentFilter(environment ?? null);

  // Get all metrics for this DAG within the timeframe
  const metrics = await prisma.metric.findMany({
    where: {
      organizationId: orgId,
      taskRun: {
        dagRun: {
          srcDagId: dagId,
          ...(startDate && { startTime: { gte: startDate } }),
          dag: { disabled: false },
          environment: envFilter,
        },
      },
    },
    include: {
      taskRun: {
        include: {
          dagRun: {
            select: {
              id: true,
              srcRunId: true,
              startTime: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { capturedAt: "asc" },
  });

  // Group by captureId
  const captureMap = new Map<string, CaptureTimeline>();

  for (const metric of metrics) {
    if (!metric.taskRun?.dagRun) continue;

    const { dagRun } = metric.taskRun;
    const captureId = metric.captureId;

    if (!captureMap.has(captureId)) {
      captureMap.set(captureId, {
        captureId,
        taskId: metric.taskRun.srcTaskId,
        dataPoints: [],
      });
    }

    const timeline = captureMap.get(captureId)!;
    const metricsData = parseMetricsJson(metric.metrics);

    timeline.dataPoints.push({
      runId: dagRun.id,
      srcRunId: dagRun.srcRunId,
      startTime: dagRun.startTime.toISOString(),
      metrics: metricsData,
      capturedAt: metric.capturedAt.toISOString(),
    });
  }

  // Sort data points by run start time (most recent last for charting)
  const timelines = Array.from(captureMap.values());
  for (const timeline of timelines) {
    timeline.dataPoints.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    // Limit data points per capture
    if (timeline.dataPoints.length > limit) {
      timeline.dataPoints = timeline.dataPoints.slice(-limit);
    }
  }

  // Sort timelines by average capture time (to maintain execution order)
  timelines.sort((a, b) => {
    const avgA = a.dataPoints.reduce((sum, dp) => sum + new Date(dp.capturedAt).getTime(), 0) / (a.dataPoints.length || 1);
    const avgB = b.dataPoints.reduce((sum, dp) => sum + new Date(dp.capturedAt).getTime(), 0) / (b.dataPoints.length || 1);
    return avgA - avgB;
  });

  return timelines;
}

/**
 * Get metrics for a specific run.
 * Returns captures ordered by execution time.
 */
export async function getRunMetrics(
  prisma: PrismaClient,
  orgId: string,
  runId: string
): Promise<RunMetrics | null> {
  const dagRun = await prisma.dagRun.findFirst({
    where: {
      id: runId,
      dag: {
        organizationId: orgId,
        disabled: false,
      },
    },
    select: {
      id: true,
      srcRunId: true,
      startTime: true,
      status: true,
      _count: { select: { alerts: { where: { status: AlertStatus.OPEN } } } },
    },
  });

  if (!dagRun) return null;

  const metrics = await prisma.metric.findMany({
    where: {
      organizationId: orgId,
      taskRun: {
        dagRunId: runId,
      },
    },
    include: {
      taskRun: {
        select: {
          srcTaskId: true,
        },
      },
    },
    orderBy: { capturedAt: "asc" },
  });

  return {
    runId: dagRun.id,
    srcRunId: dagRun.srcRunId,
    startTime: dagRun.startTime.toISOString(),
    status: displayStatusToString(getDisplayStatus(dagRun.status, dagRun._count.alerts)),
    captures: metrics.map((m) => ({
      id: m.id,
      captureId: m.captureId,
      taskId: m.taskRun?.srcTaskId ?? "unknown",
      metrics: parseMetricsJson(m.metrics),
      capturedAt: m.capturedAt.toISOString(),
    })),
  };
}
