/**
 * Notification dispatcher
 * 
 * Main entry point for sending notifications.
 * Orchestrates: check settings → get channels → render → send
 */

import type { NotificationPayload, NotifyResult } from "./types";
import { ChannelType } from "./types";
import { getActiveChannels } from "./channels";
import { getUsersWithNotificationEnabled } from "./config";
import { renderNotification } from "./templates";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { AlertType, AlertStatus } from "@prisma/client";

const logger = createLogger("NotificationDispatcher");

/**
 * Send a notification through all active channels.
 * 
 * This is the main entry point for sending notifications.
 * 
 * @example
 * ```typescript
 * import { notify, NotificationEventType } from "@/server/services/notifications";
 * 
 * await notify({
 *   organizationId: "org_123",
 *   type: NotificationEventType.ROW_COUNT_DROP_ALERT,
 *   severity: "warning",
 *   dagId: "my_dag",
 *   metadata: { baseline: 1000, current: 500, dropPercentage: 50 },
 *   dashboardUrl: "https://app.granyt.io/dashboard/alerts",
 * });
 * ```
 */
export async function notify(payload: NotificationPayload): Promise<NotifyResult> {
  const { organizationId, type } = payload;

  // Step 1: Get recipients who have this notification type enabled
  const recipients = await getUsersWithNotificationEnabled(organizationId, type);
  if (recipients.length === 0) {
    logger.debug(
      { type, organizationId },
      "No users have notification enabled"
    );
    return { sent: false, channels: [] };
  }

  // Step 2: Get all active (configured + enabled) channels
  const channels = await getActiveChannels(organizationId);
  if (channels.length === 0) {
    logger.debug({ organizationId }, "No active channels found");
    return { sent: false, channels: [] };
  }

  // Step 3: Render the notification content
  const rendered = renderNotification(payload);

  // Step 4: Send through each channel (in parallel)
  const results = await Promise.all(
    channels.map(async (channel) => {
      try {
        const config = await channel.getConfig(organizationId);
        if (!config) {
          return {
            channel: channel.displayName,
            type: channel.type,
            success: false,
            error: "No configuration found",
          };
        }

        const result = await channel.send(rendered, recipients, config);

        // If email channel fails, create an alert in the dashboard
        if (
          !result.success &&
          (channel.type === ChannelType.SMTP ||
            channel.type === ChannelType.RESEND)
        ) {
          await createIntegrationAlert(
            organizationId,
            channel.displayName,
            result.error
          );
        }

        return {
          channel: channel.displayName,
          type: channel.type,
          ...result,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          { channel: channel.displayName, error: errorMessage, organizationId },
          "Error sending notification via channel"
        );

        // Also create alert for unexpected errors in email channels
        if (
          channel.type === ChannelType.SMTP ||
          channel.type === ChannelType.RESEND
        ) {
          await createIntegrationAlert(
            organizationId,
            channel.displayName,
            errorMessage
          );
        }

        return {
          channel: channel.displayName,
          type: channel.type,
          success: false,
          error: errorMessage,
        };
      }
    })
  );

  const successCount = results.filter((r) => r.success).length;
  const anySent = successCount > 0;

  logger.info(
    {
      type,
      successCount,
      totalChannels: results.length,
      organizationId,
    },
    "Notification dispatch completed"
  );

  return { sent: anySent, channels: results };
}

/**
 * Creates an alert in the dashboard when an integration fails
 */
async function createIntegrationAlert(
  organizationId: string,
  channelName: string,
  error?: string
) {
  try {
    // Check if there's already an open alert for this channel
    const existing = await prisma.alert.findFirst({
      where: {
        organizationId,
        alertType: AlertType.INTEGRATION_ERROR,
        status: AlertStatus.OPEN,
      },
    });

    // If we already have an open integration alert, we don't want to spam
    // but we could update it or just skip. For now, let's skip to avoid noise.
    if (existing) {
      return;
    }

    await prisma.alert.create({
      data: {
        organizationId,
        alertType: AlertType.INTEGRATION_ERROR,
        severity: "critical",
        srcDagId: "system",
        dagRunId: "n/a",
        metadata: {
          channel: channelName,
          error: error || "Unknown error",
          message: `The ${channelName} connection is faulty. Please check your settings in the dashboard.`,
        },
      },
    });

    logger.info(
      { organizationId, channelName },
      "Created integration failure alert"
    );
  } catch (err) {
    logger.error(
      { err, channelName, organizationId },
      "Failed to create integration alert"
    );
  }
}

/**
 * Send a notification without checking if the notification type is enabled.
 * Useful for test notifications or system notifications.
 */
export async function notifyForced(payload: NotificationPayload): Promise<NotifyResult> {
  const { organizationId } = payload;

  // Get all members of the organization
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: { user: true },
  });

  if (members.length === 0) {
    return { sent: false, channels: [] };
  }

  const recipients = members.map((m) => ({
    email: m.user.email,
    name: m.user.name,
  }));

  // Get all active channels
  const channels = await getActiveChannels(organizationId);
  if (channels.length === 0) {
    return { sent: false, channels: [] };
  }

  // Render and send
  const rendered = renderNotification(payload);

  const results = await Promise.all(
    channels.map(async (channel) => {
      try {
        const config = await channel.getConfig(organizationId);
        if (!config) {
          return {
            channel: channel.displayName,
            type: channel.type,
            success: false,
            error: "No configuration found",
          };
        }

        const result = await channel.send(rendered, recipients, config);
        return {
          channel: channel.displayName,
          type: channel.type,
          ...result,
        };
      } catch (error) {
        return {
          channel: channel.displayName,
          type: channel.type,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return {
    sent: results.some((r) => r.success),
    channels: results,
  };
}
