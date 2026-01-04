import { prisma } from "@/lib/prisma";
import { parseMetricsJson } from "@/lib/json-schemas";
import { BUILTIN_METRICS, type AvailableMetricsResult } from "./types";

interface GetAvailableMetricsParams {
  organizationId: string;
  dagId: string;
}

/** Custom metric with task context */
export interface CustomMetricWithTask {
  name: string;
  taskId: string;
}

/** Extended result including task-grouped metrics */
export interface AvailableMetricsResultWithTasks extends AvailableMetricsResult {
  customMetricsWithTasks: CustomMetricWithTask[];
}

/**
 * Get all available metrics for a DAG.
 * This includes built-in metrics plus any metrics that have been captured.
 * Metrics are returned both as flat names and grouped by task.
 */
export async function getAvailableMetrics(
  params: GetAvailableMetricsParams
): Promise<AvailableMetricsResultWithTasks> {
  const { organizationId, dagId } = params;

  // Get unique metrics from Metric.metrics for this DAG
  // Also include the taskRun's srcTaskId for grouping
  const metrics = await prisma.metric.findMany({
    where: {
      organizationId,
      taskRun: {
        dagRun: {
          srcDagId: dagId,
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
    take: 100, // Limit to recent metrics
    orderBy: { capturedAt: "desc" },
  });

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
    builtinMetrics: BUILTIN_METRICS,
    customMetrics: Array.from(metricNames).sort(),
    customMetricsWithTasks,
  };
}
