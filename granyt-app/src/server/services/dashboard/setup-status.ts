import { PrismaClient } from "@prisma/client";

export interface SetupStatus {
  hasDagRuns: boolean;
  hasNotificationChannel: boolean;
  hasErrors: boolean;
}

/**
 * Returns the setup status for an organization to power the getting started checklist.
 * Checks if the organization has received DAG runs, configured notifications, and tracked errors.
 */
export async function getSetupStatus(
  prisma: PrismaClient,
  organizationId: string
): Promise<SetupStatus> {
  const [dagRunCount, channelCount, errorCount] = await Promise.all([
    prisma.dagRun.count({
      where: { organizationId },
      take: 1,
    }),
    prisma.organizationChannelConfig.count({
      where: { 
        organizationId,
        enabled: true,
      },
      take: 1,
    }),
    prisma.errorOccurrence.count({
      where: { organizationId },
      take: 1,
    }),
  ]);

  return {
    hasDagRuns: dagRunCount > 0,
    hasNotificationChannel: channelCount > 0,
    hasErrors: errorCount > 0,
  };
}
