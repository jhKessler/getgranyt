/**
 * Notification configuration helpers
 * 
 * Functions for checking if notifications are enabled and getting recipients.
 */

import { prisma } from "@/lib/prisma";
import { 
  getNotificationDefaults, 
  NotificationTypes,
  type NotificationTypeValue 
} from "@/lib/notifications";
import { NotificationEventType, type NotificationRecipient } from "./types";

/**
 * Map notification event types to the settings types in the database
 */
const EVENT_TO_SETTING_MAP: Record<NotificationEventType, NotificationTypeValue[]> = {
  [NotificationEventType.ROW_COUNT_DROP_ALERT]: [
    NotificationTypes.ALL_ALERTS,
    NotificationTypes.ROW_COUNT_DROP_ALERT,
  ],
  [NotificationEventType.NULL_OCCURRENCE_ALERT]: [
    NotificationTypes.ALL_ALERTS,
    NotificationTypes.NULL_OCCURRENCE_ALERT,
  ],
  [NotificationEventType.SCHEMA_CHANGE_ALERT]: [
    NotificationTypes.ALL_ALERTS,
    NotificationTypes.SCHEMA_CHANGE_ALERT,
  ],
  // Batch alerts summary - uses ALL_ALERTS since it contains multiple alert types
  [NotificationEventType.DAG_RUN_ALERTS_SUMMARY]: [
    NotificationTypes.ALL_ALERTS,
  ],
  [NotificationEventType.PIPELINE_ERROR]: [
    NotificationTypes.ALL_ERRORS,
  ],
  [NotificationEventType.NEW_PIPELINE_ERROR]: [
    NotificationTypes.NEW_ERRORS_ONLY,
  ],
};

/**
 * Get all users in an organization who have a specific notification type enabled.
 * Uses the user's settings, falling back to defaults.
 */
export async function getUsersWithNotificationEnabled(
  organizationId: string,
  eventType: NotificationEventType
): Promise<NotificationRecipient[]> {
  const requiredSettings = EVENT_TO_SETTING_MAP[eventType];
  
  if (!requiredSettings || requiredSettings.length === 0) {
    return [];
  }

  // Get all members of the organization with their notification settings
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        include: {
          notificationSettings: {
            where: {
              notificationType: { in: requiredSettings },
            },
          },
        },
      },
    },
  });

  const defaults = getNotificationDefaults();
  const recipients: NotificationRecipient[] = [];

  for (const member of members) {
    const settings = member.user.notificationSettings;
    const settingsMap = new Map(
      settings.map((s) => [s.notificationType, s.enabled])
    );

    let isEnabled = false;

    // For alerts: check parent (ALL_ALERTS) and specific type
    if (eventType.includes("ALERT")) {
      const allAlertsEnabled = settingsMap.get(NotificationTypes.ALL_ALERTS) 
        ?? defaults[NotificationTypes.ALL_ALERTS];
      
      if (allAlertsEnabled) {
        // Check specific alert type
        const specificType = requiredSettings.find((t) => t !== NotificationTypes.ALL_ALERTS);
        if (specificType) {
          isEnabled = settingsMap.get(specificType) ?? defaults[specificType];
        } else {
          isEnabled = true;
        }
      }
    }
    // For errors: check ALL_ERRORS or NEW_ERRORS_ONLY
    else if (eventType === NotificationEventType.PIPELINE_ERROR) {
      isEnabled = settingsMap.get(NotificationTypes.ALL_ERRORS)
        ?? defaults[NotificationTypes.ALL_ERRORS];
    }
    else if (eventType === NotificationEventType.NEW_PIPELINE_ERROR) {
      const newErrorsOnlyEnabled = settingsMap.get(NotificationTypes.NEW_ERRORS_ONLY)
        ?? defaults[NotificationTypes.NEW_ERRORS_ONLY];
      const allErrorsEnabled = settingsMap.get(NotificationTypes.ALL_ERRORS)
        ?? defaults[NotificationTypes.ALL_ERRORS];
      isEnabled = newErrorsOnlyEnabled || allErrorsEnabled;
    }

    if (isEnabled) {
      recipients.push({
        email: member.user.email,
        name: member.user.name,
      });
    }
  }

  return recipients;
}

/**
 * Check if a notification type setting is enabled for a specific user
 */
export async function getNotificationSetting(
  userId: string,
  notificationType: NotificationTypeValue
): Promise<boolean> {
  const setting = await prisma.userNotificationSettings.findUnique({
    where: {
      userId_notificationType: {
        userId,
        notificationType,
      },
    },
  });

  const defaults = getNotificationDefaults();
  return setting?.enabled ?? defaults[notificationType];
}

/**
 * Update a notification type setting for a user
 */
export async function updateNotificationSetting(
  userId: string,
  notificationType: NotificationTypeValue,
  enabled: boolean
): Promise<void> {
  await prisma.userNotificationSettings.upsert({
    where: {
      userId_notificationType: {
        userId,
        notificationType,
      },
    },
    create: {
      userId,
      notificationType,
      enabled,
    },
    update: {
      enabled,
    },
  });
}
