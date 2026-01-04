import { prisma } from "@/lib/prisma";
import { AlertStatus } from "@prisma/client";
import { reduceDagSensitivity } from "../engine";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AlertActions");

export type DismissReason = "expected_behavior" | "one_time" | "other";

/**
 * Acknowledges an alert (user has seen it but not resolved)
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<void> {
  await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
    },
  });
  logger.info({ alertId, userId }, "Alert acknowledged");
}

/**
 * Dismisses an alert with a reason.
 * If reason is "expected_behavior", also reduces sensitivity for future alerts.
 */
export async function dismissAlert(
  alertId: string,
  userId: string,
  reason: DismissReason
): Promise<void> {
  const alert = await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: AlertStatus.DISMISSED,
      dismissedAt: new Date(),
      dismissedBy: userId,
      dismissReason: reason,
    },
  });

  logger.info({ alertId, userId, reason }, "Alert dismissed");

  // If user says "this is expected behavior", reduce sensitivity
  if (reason === "expected_behavior" && alert.srcDagId) {
    await reduceDagSensitivity(
      alert.organizationId,
      alert.srcDagId,
      alert.captureId,
      alert.alertType
    );
  }
}

/**
 * Auto-resolves an alert (e.g., when the issue fixes itself)
 */
export async function autoResolveAlert(alertId: string): Promise<void> {
  await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: AlertStatus.AUTO_RESOLVED,
    },
  });
  logger.info({ alertId }, "Alert auto-resolved");
}

/**
 * Removes acknowledgment from an alert, setting it back to OPEN
 */
export async function unacknowledgeAlert(alertId: string): Promise<void> {
  await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: AlertStatus.OPEN,
      acknowledgedAt: null,
      acknowledgedBy: null,
    },
  });
  logger.info({ alertId }, "Alert unacknowledged");
}

/**
 * Reopens a dismissed or acknowledged alert
 */
export async function reopenAlert(alertId: string): Promise<void> {
  await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: AlertStatus.OPEN,
      acknowledgedAt: null,
      acknowledgedBy: null,
      dismissedAt: null,
      dismissedBy: null,
      dismissReason: null,
    },
  });
  logger.info({ alertId }, "Alert reopened");
}
