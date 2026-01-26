import { prisma } from "@/lib/prisma";
import { AlertType, AlertStatus } from "@prisma/client";

export interface GetAlertsParams {
  organizationId: string;
  status?: AlertStatus | AlertStatus[];
  alertType?: AlertType;
  srcDagId?: string;
  dagRunId?: string;
  environment?: string;
  limit?: number;
  offset?: number;
}

export interface AlertWithContext {
  id: string;
  alertType: AlertType;
  status: AlertStatus;
  severity: string;
  srcDagId: string | null;
  captureId: string | null;
  dagRunId: string | null;
  srcRunId: string; // Source system run ID (e.g., Airflow run_id)
  taskRunId: string | null;
  metadata: unknown;
  createdAt: Date;
  acknowledgedAt: Date | null;
  dismissedAt: Date | null;
  dismissReason: string | null;
  // Joined data
  dagName?: string;
  dagDescription?: string;
  environment?: string | null;
}

/**
 * Gets alerts for an organization with optional filters
 */
export async function getAlerts(params: GetAlertsParams): Promise<AlertWithContext[]> {
  const {
    organizationId,
    status,
    alertType,
    srcDagId,
    dagRunId,
    environment,
    limit = 50,
    offset = 0,
  } = params;

  const statusFilter = status
    ? Array.isArray(status)
      ? { in: status }
      : status
    : undefined;

  const alerts = await prisma.alert.findMany({
    where: {
      organizationId,
      status: statusFilter,
      alertType,
      srcDagId,
      dagRunId,
      ...(environment && { dagRun: { environment } }),
    },
    include: {
      dagRun: {
        select: {
          srcRunId: true,
          environment: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: offset,
  });

  // Fetch DAG info for context
  const dagIds = [...new Set(alerts.map((a) => a.srcDagId).filter((id): id is string => id !== null))];
  const dags = await prisma.dag.findMany({
    where: {
      organizationId,
      srcDagId: { in: dagIds },
    },
    select: {
      srcDagId: true,
      description: true,
    },
  });

  const dagMap = new Map(dags.map((d) => [d.srcDagId, d]));

  return alerts.map((alert) => {
    const dag = alert.srcDagId ? dagMap.get(alert.srcDagId) : null;
    return {
      ...alert,
      srcRunId: alert.dagRun?.srcRunId ?? "n/a",
      dagName: alert.srcDagId ?? "system",
      dagDescription: dag?.description ?? undefined,
      environment: alert.dagRun?.environment ?? "system",
    };
  });
}

/**
 * Gets a single alert by ID with full context
 */
export async function getAlertById(
  alertId: string,
  organizationId: string
): Promise<AlertWithContext | null> {
  const alert = await prisma.alert.findFirst({
    where: {
      id: alertId,
      organizationId,
    },
    include: {
      dagRun: {
        select: {
          srcRunId: true,
          environment: true,
        },
      },
    },
  });

  if (!alert) return null;

  const dag = alert.srcDagId 
    ? await prisma.dag.findFirst({
        where: {
          organizationId,
          srcDagId: alert.srcDagId,
        },
        select: {
          srcDagId: true,
          description: true,
        },
      })
    : null;

  return {
    ...alert,
    srcRunId: alert.dagRun?.srcRunId ?? "n/a",
    dagName: alert.srcDagId ?? "system",
    dagDescription: dag?.description ?? undefined,
    environment: alert.dagRun?.environment ?? null,
  };
}

/**
 * Counts open alerts for an organization
 */
export async function countOpenAlerts(
  organizationId: string,
  environment?: string
): Promise<number> {
  return prisma.alert.count({
    where: {
      organizationId,
      status: AlertStatus.OPEN,
      ...(environment && { dagRun: { environment } }),
    },
  });
}

/**
 * Gets open alerts count grouped by severity
 */
export async function getAlertsSummary(
  organizationId: string,
  environment?: string
): Promise<{ critical: number; warning: number; total: number }> {
  // Note: Using findMany instead of groupBy because groupBy doesn't support relation filtering
  const alerts = await prisma.alert.findMany({
    where: {
      organizationId,
      status: AlertStatus.OPEN,
      ...(environment && { dagRun: { environment } }),
    },
    select: { severity: true },
  });

  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;

  return {
    critical,
    warning,
    total: critical + warning,
  };
}
