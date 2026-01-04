import { PrismaClient } from "@prisma/client";

/**
 * Cleans up existing seeded data before re-seeding
 * Order matters due to foreign key constraints
 */
export async function cleanupExistingData(prisma: PrismaClient, organizationId: string): Promise<void> {
  console.log("🗑️  Cleaning up existing data...");

  // Clean up alerts first (references task runs)
  await prisma.alert.deleteMany({
    where: { organizationId },
  });
  await prisma.alertEvaluationJob.deleteMany({
    where: { organizationId },
  });
  await prisma.dagAlertSettings.deleteMany({
    where: { organizationId },
  });
  await prisma.organizationAlertSettings.deleteMany({
    where: { organizationId },
  });

  // Clean up errors (references task runs)
  await prisma.errorOccurrence.deleteMany({
    where: { organizationId },
  });
  await prisma.generalError.deleteMany({
    where: { organizationId },
  });

  // Then metrics -> task runs -> dag runs -> dags
  await prisma.metric.deleteMany({
    where: { organizationId },
  });
  await prisma.taskRun.deleteMany({
    where: { organizationId },
  });
  await prisma.dagRun.deleteMany({
    where: { organizationId },
  });
  await prisma.dag.deleteMany({
    where: { organizationId },
  });

  // Clean up DAG computed metrics
  await prisma.dagComputedMetrics.deleteMany({
    where: { organizationId },
  });

  // Clean up dag run metric snapshots
  await prisma.dagRunMetricSnapshot.deleteMany({
    where: { organizationId },
  });

  // Clean up DAG metrics settings
  await prisma.dagMetricsSettings.deleteMany({
    where: { organizationId },
  });

  console.log("✅ Cleaned up existing DAGs, runs, metrics, errors, alerts, and DAG settings");
}
