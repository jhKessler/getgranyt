import { AlertStatus, PrismaClient } from "@prisma/client";
import {
  parseMetricsJson,
} from "@/lib/json-schemas";
import { getDisplayStatus, displayStatusToString } from "../status-utils";

/**
 * Task run information
 */
export interface TaskRunInfo {
  id: string;
  srcTaskId: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
  operator: string | null;
  errorMessage: string | null;
  errorId: string | null;
}

/**
 * Schema information for DataFrame captures
 */
export interface SchemaInfo {
  column_dtypes: Record<string, string>;
  null_counts?: Record<string, number>;
  empty_string_counts?: Record<string, number>;
}

/**
 * Capture point with full details
 */
export interface CapturePointInfo {
  id: string;
  captureId: string;
  taskId: string;
  metrics: Record<string, unknown>; // All metrics as flexible JSON
  schema: SchemaInfo | null; // DataFrame schema info
  capturedAt: string;
}

/**
 * Full run details including tasks and captures
 */
export interface RunDetails {
  id: string;
  srcDagId: string;
  srcRunId: string;
  environment: string | null;
  status: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  runType: string | null;
  tasks: TaskRunInfo[];
  captures: CapturePointInfo[];
}

/**
 * Get full details for a specific run including tasks and data captures
 */
export async function getRunDetails(
  prisma: PrismaClient,
  orgId: string,
  runId: string
): Promise<RunDetails | null> {
  const dagRun = await prisma.dagRun.findFirst({
    where: {
      id: runId,
      dag: {
        organizationId: orgId,
        disabled: false,
      },
    },
    include: {
      _count: { select: { alerts: { where: { status: AlertStatus.OPEN } } } },
      taskRuns: {
        orderBy: { startTime: "asc" },
        include: {
          errors: {
            select: {
              generalErrorId: true,
            },
            take: 1,
            orderBy: { timestamp: "desc" },
          },
        },
      },
    },
  });

  if (!dagRun) return null;

  // Get all metrics for this run's tasks
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
    id: dagRun.id,
    srcDagId: dagRun.srcDagId,
    srcRunId: dagRun.srcRunId,
    environment: dagRun.environment,
    status: displayStatusToString(getDisplayStatus(dagRun.status, dagRun._count.alerts)),
    startTime: dagRun.startTime.toISOString(),
    endTime: dagRun.endTime?.toISOString() ?? null,
    duration: dagRun.duration,
    runType: dagRun.runType,
    tasks: dagRun.taskRuns.map((task) => ({
      id: task.id,
      srcTaskId: task.srcTaskId,
      status: task.status,
      startTime: task.startTime?.toISOString() ?? null,
      endTime: task.endTime?.toISOString() ?? null,
      duration: task.duration,
      operator: task.operator,
      errorMessage: task.errorMessage,
      errorId: task.errors[0]?.generalErrorId ?? null,
    })),
    captures: metrics.map((m) => ({
      id: m.id,
      captureId: m.captureId,
      taskId: m.taskRun?.srcTaskId ?? "unknown",
      metrics: parseMetricsJson(m.metrics),
      schema: m.schema as SchemaInfo | null,
      capturedAt: m.capturedAt.toISOString(),
    })),
  };
}
