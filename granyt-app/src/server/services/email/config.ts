import { prisma } from "@/lib/prisma";
import { ALERT_TYPE_TO_NOTIFICATION_TYPE, getNotificationDefaults, NotificationTypes, type NotificationTypeValue } from "@/lib/notifications";
import type { SmtpConfig, EmailRecipient, NotificationCheckResult } from "./types";

/**
 * Gets SMTP configuration for an organization.
 * Priority: Database settings > Environment variables
 */
export async function getSmtpConfig(
  organizationId: string
): Promise<SmtpConfig | null> {
  // First check database settings (new channel config)
  const channelConfig = await prisma.organizationChannelConfig.findUnique({
    where: {
      organizationId_channelType: {
        organizationId,
        channelType: "SMTP",
      },
    },
  });

  if (channelConfig?.config) {
    const config = channelConfig.config as unknown as SmtpConfig;
    if (
      config.host &&
      config.port &&
      config.user &&
      config.password &&
      config.fromEmail
    ) {
      return {
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        secure: config.secure ?? true,
        fromEmail: config.fromEmail,
        fromName: config.fromName || "Granyt",
      };
    }
  }

  // Fall back to environment variables
  const envHost = process.env.SMTP_HOST;
  const envPort = process.env.SMTP_PORT;
  const envUser = process.env.SMTP_USER;
  const envPassword = process.env.SMTP_PASSWORD;
  const envFromEmail = process.env.SMTP_FROM_EMAIL;
  const envFromName = process.env.SMTP_FROM_NAME;

  if (envHost && envPort && envUser && envPassword && envFromEmail) {
    return {
      host: envHost,
      port: parseInt(envPort, 10),
      user: envUser,
      password: envPassword,
      secure: process.env.SMTP_SECURE !== "false",
      fromEmail: envFromEmail,
      fromName: envFromName || "Granyt",
    };
  }

  return null;
}

/**
 * Checks if a notification type is enabled for a user
 */
export async function isNotificationEnabled(
  userId: string,
  notificationType: NotificationTypeValue
): Promise<boolean> {
  // Check specific setting
  const setting = await prisma.userNotificationSettings.findUnique({
    where: {
      userId_notificationType: {
        userId,
        notificationType,
      },
    },
  });

  // Use centralized defaults if no setting exists
  const defaults = getNotificationDefaults();
  return setting?.enabled ?? defaults[notificationType];
}

/**
 * Determines if a notification should be sent for an alert type
 */
export async function shouldSendAlertNotification(
  organizationId: string,
  alertType: "ROW_COUNT_DROP" | "NULL_OCCURRENCE" | "SCHEMA_CHANGE"
): Promise<NotificationCheckResult> {
  const smtpConfig = await getSmtpConfig(organizationId);
  
  if (!smtpConfig) {
    return { shouldSend: false, recipients: [], smtpConfig: null };
  }

  // Get all members of the organization with their notification settings
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        include: {
          notificationSettings: true,
        },
      },
    },
  });

  const defaults = getNotificationDefaults();
  const specificType = ALERT_TYPE_TO_NOTIFICATION_TYPE[alertType];
  const recipients: EmailRecipient[] = [];

  for (const member of members) {
    const settings = member.user.notificationSettings;
    
    const allAlertsEnabled = settings.find(s => s.notificationType === NotificationTypes.ALL_ALERTS)?.enabled 
      ?? defaults[NotificationTypes.ALL_ALERTS];
    
    const specificEnabled = settings.find(s => s.notificationType === specificType)?.enabled 
      ?? defaults[specificType];

    if (allAlertsEnabled && specificEnabled) {
      recipients.push({
        email: member.user.email,
        name: member.user.name,
      });
    }
  }

  return {
    shouldSend: recipients.length > 0,
    recipients,
    smtpConfig,
  };
}

/**
 * Determines if a notification should be sent for errors
 */
export async function shouldSendErrorNotification(
  organizationId: string,
  isNewError: boolean = false
): Promise<NotificationCheckResult> {
  const smtpConfig = await getSmtpConfig(organizationId);
  
  if (!smtpConfig) {
    return { shouldSend: false, recipients: [], smtpConfig: null };
  }

  // Get all members of the organization with their notification settings
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        include: {
          notificationSettings: true,
        },
      },
    },
  });

  const defaults = getNotificationDefaults();
  const recipients: EmailRecipient[] = [];

  for (const member of members) {
    const settings = member.user.notificationSettings;
    
    const allErrorsEnabled = settings.find(s => s.notificationType === NotificationTypes.ALL_ERRORS)?.enabled 
      ?? defaults[NotificationTypes.ALL_ERRORS];
    
    const newErrorsOnlyEnabled = settings.find(s => s.notificationType === NotificationTypes.NEW_ERRORS_ONLY)?.enabled 
      ?? defaults[NotificationTypes.NEW_ERRORS_ONLY];

    // Logic:
    // - If ALL_ERRORS is disabled, no error notifications
    // - If ALL_ERRORS is enabled and NEW_ERRORS_ONLY is enabled, only notify for new errors
    // - If ALL_ERRORS is enabled and NEW_ERRORS_ONLY is disabled, notify for all errors
    
    if (!allErrorsEnabled) continue;
    if (newErrorsOnlyEnabled && !isNewError) continue;

    recipients.push({
      email: member.user.email,
      name: member.user.name,
    });
  }

  return {
    shouldSend: recipients.length > 0,
    recipients,
    smtpConfig,
  };
}
