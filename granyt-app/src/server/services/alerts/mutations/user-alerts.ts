import { prisma } from "@/lib/prisma";
import { AlertType, AlertStatus } from "@prisma/client";
import { notify, NotificationEventType } from "@/server/services/notifications";
import { env } from "@/env";
import { createLogger } from "@/lib/logger";

const logger = createLogger("UserAlerts");

interface CreateUserAlertParams {
  organizationId: string;
  srcDagId: string;
  dagRunId: string;
  taskRunId: string;
  title: string;
  description?: string;
  sendNotification: boolean;
  environment?: string | null;
}

/**
 * Creates a user-defined alert from the create_alert XCom key.
 *
 * This is called when a DAG task returns:
 * ```python
 * return {
 *     "granyt": {
 *         "create_alert": {
 *             "title": "Alert title",
 *             "description": "Optional description",
 *             "send_notification": True  # Optional, defaults to False
 *         }
 *     }
 * }
 * ```
 */
export async function createUserAlert(params: CreateUserAlertParams) {
  const {
    organizationId,
    srcDagId,
    dagRunId,
    taskRunId,
    title,
    description,
    sendNotification,
    environment,
  } = params;

  // Create the alert
  const alert = await prisma.alert.create({
    data: {
      organizationId,
      alertType: AlertType.USER_CREATED,
      status: AlertStatus.OPEN,
      severity: "warning",
      srcDagId,
      captureId: `user-alert:${taskRunId}`,
      dagRunId,
      taskRunId,
      metadata: {
        title,
        description: description ?? null,
        createdVia: "xcom",
      },
    },
  });

  logger.info(
    { alertId: alert.id, dagId: srcDagId, title },
    "Created user alert"
  );

  // Send notification if requested
  if (sendNotification) {
    const dashboardUrl = env.NEXT_PUBLIC_APP_URL
      ? `${env.NEXT_PUBLIC_APP_URL}/dashboard/dags/${encodeURIComponent(srcDagId)}/alerts`
      : undefined;

    // Get DAG run info for notification context
    const dagRun = await prisma.dagRun.findUnique({
      where: { id: dagRunId },
      select: { srcRunId: true, runType: true },
    });

    await notify({
      organizationId,
      type: NotificationEventType.USER_CREATED_ALERT,
      severity: "warning",
      dagId: srcDagId,
      alertId: alert.id,
      title,
      description,
      environment,
      runType: dagRun?.runType,
      dashboardUrl,
    }).catch((err) => {
      logger.error(
        { error: err, alertId: alert.id },
        "Failed to send user alert notification"
      );
    });
  }

  return alert;
}
