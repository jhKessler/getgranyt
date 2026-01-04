import { prisma } from "@/lib/prisma";
import { AlertStatus } from "@prisma/client";
import { parseMetricsJson } from "@/lib/json-schemas";
import { getDisplayStatus, displayStatusToString } from "../status-utils";

interface UpdateSnapshotParams {
  organizationId: string;
  dagRunId: string;
}

/**
 * Update or create the metric snapshot for a DAG run.
 * This computes all metrics (built-in and custom) and stores them.
 * Called whenever data is ingested or a run status changes.
 */
export async function updateDagRunMetricSnapshot(
  params: UpdateSnapshotParams
): Promise<void> {
  const { organizationId, dagRunId } = params;

  // Get the DAG run with all relevant data
  const dagRun = await prisma.dagRun.findUnique({
    where: { id: dagRunId },
    include: {
      taskRuns: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!dagRun) return;

  // Calculate built-in metrics
  const taskCount = dagRun.taskRuns.length;
  const successfulTasks = dagRun.taskRuns.filter((t) => t.status === "success").length;
  const successRate = taskCount > 0 ? (successfulTasks / taskCount) * 100 : null;

  // Get error count for this run
  const errorCount = await prisma.errorOccurrence.count({
    where: {
      taskRun: { dagRunId },
    },
  });

  // Get all metrics for this run and aggregate them
  const metrics = await prisma.metric.findMany({
    where: {
      organizationId,
      taskRun: { dagRunId },
    },
    select: { metrics: true },
  });

  // Sum up row_count from all metrics and collect all metric keys
  let rowsProcessed = BigInt(0);
  const aggregatedMetrics: Record<string, number | string> = {};
  
  for (const m of metrics) {
    const parsed = parseMetricsJson(m.metrics);
    
    // Sum row_count if present
    if (typeof parsed.row_count === "number") {
      rowsProcessed += BigInt(Math.floor(parsed.row_count));
    }
    
    // Aggregate all numeric metrics (sum them, or take last value for non-numeric)
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number") {
        aggregatedMetrics[key] = ((aggregatedMetrics[key] as number) ?? 0) + value;
      } else if (typeof value === "string" && !aggregatedMetrics[key]) {
        aggregatedMetrics[key] = value;
      }
    }
  }

  const customMetrics = Object.keys(aggregatedMetrics).length > 0 ? aggregatedMetrics : null;

  // Upsert the metric snapshot
  await prisma.dagRunMetricSnapshot.upsert({
    where: { dagRunId },
    create: {
      organizationId,
      dagRunId,
      srcDagId: dagRun.srcDagId,
      environment: dagRun.environment,
      duration: dagRun.duration,
      rowsProcessed,
      taskCount,
      errorCount,
      successRate,
      customMetrics: customMetrics ?? undefined,
    },
    update: {
      duration: dagRun.duration,
      rowsProcessed,
      taskCount,
      errorCount,
      successRate,
      customMetrics: customMetrics ?? undefined,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get metric snapshot for a specific DAG run
 */
export async function getDagRunMetricSnapshot(dagRunId: string) {
  return prisma.dagRunMetricSnapshot.findUnique({
    where: { dagRunId },
  });
}

/**
 * Get metric snapshots for multiple DAG runs for a specific DAG
 */
export async function getDagRunMetricSnapshots(params: {
  organizationId: string;
  srcDagId: string;
  environment?: string | null;
  startDate: Date | null;
  limit: number;
}) {
  const { organizationId, srcDagId, environment, startDate, limit } = params;

  const snapshots = await prisma.dagRunMetricSnapshot.findMany({
    where: {
      organizationId,
      srcDagId,
      ...(environment !== undefined && environment !== null
        ? { environment }
        : {}),
      ...(startDate && {
        dagRun: {
          startTime: { gte: startDate },
        },
      }),
    },
    orderBy: { dagRun: { startTime: "desc" } },
    take: limit,
    include: {
      dagRun: {
        include: {
          _count: { select: { alerts: { where: { status: AlertStatus.OPEN } } } },
        },
      },
    },
  });

  // Convert BigInt to Number for JSON serialization and compute display status
  return snapshots.map((snapshot) => ({
    ...snapshot,
    rowsProcessed: Number(snapshot.rowsProcessed),
    dagRun: {
      id: snapshot.dagRun.id,
      srcRunId: snapshot.dagRun.srcRunId,
      startTime: snapshot.dagRun.startTime,
      runType: snapshot.dagRun.runType,
      status: displayStatusToString(getDisplayStatus(snapshot.dagRun.status, snapshot.dagRun._count.alerts)),
    },
  }));
}

/** Custom metric with task context */
export interface CustomMetricWithTask {
  name: string;
  taskId: string;
}

/**
 * Get all available metric names for a DAG (to populate the metric selector)
 */
export async function getAvailableMetricsForDag(params: {
  organizationId: string;
  srcDagId: string;
  environment?: string | null;
}): Promise<{
  builtinMetrics: string[];
  customMetrics: string[];
  customMetricsWithTasks: CustomMetricWithTask[];
}> {
  const { organizationId, srcDagId, environment } = params;

  // Get recent Metrics to discover available metric keys WITH task info
  const metrics = await prisma.metric.findMany({
    where: {
      organizationId,
      taskRun: {
        dagRun: {
          srcDagId,
          ...(environment !== undefined && environment !== null
            ? { environment }
            : {}),
        },
      },
    },
    select: {
      metrics: true,
      taskRun: {
        select: {
          srcTaskId: true,
        },
      },
    },
    take: 100, // Sample recent metrics
    orderBy: { capturedAt: "desc" },
  });

  // Collect unique metric names
  const metricNames = new Set<string>();
  // Track unique metric+task combinations
  const metricTaskMap = new Map<string, Set<string>>(); // metricName -> Set of taskIds

  for (const metric of metrics) {
    const parsed = parseMetricsJson(metric.metrics);
    const taskId = metric.taskRun?.srcTaskId ?? "unknown";
    
    for (const [key, value] of Object.entries(parsed)) {
      // Only include metrics that have numeric values
      if (typeof value === "number") {
        metricNames.add(key);
        
        // Track which tasks have this metric
        if (!metricTaskMap.has(key)) {
          metricTaskMap.set(key, new Set());
        }
        metricTaskMap.get(key)!.add(taskId);
      }
    }
  }

  // Build the task-grouped metrics list
  const customMetricsWithTasks: CustomMetricWithTask[] = [];
  for (const [metricName, taskIds] of metricTaskMap) {
    for (const taskId of taskIds) {
      customMetricsWithTasks.push({ name: metricName, taskId });
    }
  }

  // Sort by task first, then by metric name
  customMetricsWithTasks.sort((a, b) => {
    const taskCompare = a.taskId.localeCompare(b.taskId);
    if (taskCompare !== 0) return taskCompare;
    return a.name.localeCompare(b.name);
  });

  return {
    builtinMetrics: ["duration"],
    customMetrics: Array.from(metricNames).sort(),
    customMetricsWithTasks,
  };
}
