/**
 * Notification filter logic
 *
 * Filters to determine if a notification should be sent to a user
 * based on their environment and run type preferences.
 */

import { prisma } from "@/lib/prisma";

export type EnvironmentFilter = "all" | "default_only";

export interface NotificationFilters {
  environmentFilter: EnvironmentFilter;
  includeManualRuns: boolean;
}

const DEFAULT_FILTERS: NotificationFilters = {
  environmentFilter: "all",
  includeManualRuns: true,
};

/**
 * Get notification filters for a user
 */
export async function getUserNotificationFilters(
  userId: string
): Promise<NotificationFilters> {
  const filters = await prisma.userNotificationFilters.findUnique({
    where: { userId },
  });

  if (!filters) {
    return DEFAULT_FILTERS;
  }

  return {
    environmentFilter: filters.environmentFilter as EnvironmentFilter,
    includeManualRuns: filters.includeManualRuns,
  };
}

/**
 * Update notification filters for a user
 */
export async function updateUserNotificationFilters(
  userId: string,
  updates: Partial<NotificationFilters>
): Promise<void> {
  await prisma.userNotificationFilters.upsert({
    where: { userId },
    create: {
      userId,
      ...updates,
    },
    update: updates,
  });
}

/**
 * Get the default environment name for an organization
 */
export async function getDefaultEnvironmentName(
  organizationId: string
): Promise<string | null> {
  const defaultEnv = await prisma.environment.findFirst({
    where: {
      organizationId,
      isDefault: true,
    },
    select: { name: true },
  });

  return defaultEnv?.name ?? null;
}

/**
 * Check if a notification should be sent to a user based on their filter settings
 */
export async function shouldSendNotificationToUser(
  userId: string,
  organizationId: string,
  context: {
    environment?: string | null;
    runType?: string | null;
  }
): Promise<boolean> {
  const filters = await getUserNotificationFilters(userId);

  // Check environment filter
  if (filters.environmentFilter === "default_only" && context.environment) {
    const defaultEnvName = await getDefaultEnvironmentName(organizationId);
    // If we have a default env and the notification env doesn't match, filter it out
    if (defaultEnvName && context.environment !== defaultEnvName) {
      return false;
    }
  }

  // Check manual run filter
  if (!filters.includeManualRuns && context.runType === "manual") {
    return false;
  }

  return true;
}

/**
 * Filter a list of recipients based on their individual notification filter settings.
 * Returns only the recipients who should receive the notification.
 */
export async function filterRecipientsByPreferences(
  organizationId: string,
  recipients: Array<{ email: string; name?: string | null }>,
  context: {
    environment?: string | null;
    runType?: string | null;
  }
): Promise<Array<{ email: string; name?: string | null }>> {
  // If no context to filter on, return all recipients
  if (!context.environment && !context.runType) {
    return recipients;
  }

  // Get user IDs for the recipient emails
  const users = await prisma.user.findMany({
    where: {
      email: { in: recipients.map((r) => r.email) },
    },
    select: { id: true, email: true },
  });

  const emailToUserId = new Map(users.map((u) => [u.email, u.id]));

  // Check each recipient's filter settings
  const filteredRecipients: Array<{ email: string; name?: string | null }> = [];

  for (const recipient of recipients) {
    const userId = emailToUserId.get(recipient.email);
    if (!userId) {
      // User not found in database, include by default
      filteredRecipients.push(recipient);
      continue;
    }

    const shouldSend = await shouldSendNotificationToUser(
      userId,
      organizationId,
      context
    );
    if (shouldSend) {
      filteredRecipients.push(recipient);
    }
  }

  return filteredRecipients;
}
