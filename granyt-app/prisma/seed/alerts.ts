import { PrismaClient, AlertType, AlertStatus } from "@prisma/client";

/**
 * Seeds 3 sample alerts connected to existing DAG runs and capture points
 * 🚨 These alerts showcase different alert types and statuses
 */
export async function seedAlerts(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  console.log("🚨 Seeding sample alerts...");

  // Get some existing DAG runs to connect alerts to
  const dagRuns = await prisma.dagRun.findMany({
    where: { organizationId },
    include: { taskRuns: true },
    take: 5,
    orderBy: { startTime: "desc" },
  });

  if (dagRuns.length < 3) {
    console.log("⚠️ Not enough DAG runs to seed alerts, skipping...");
    return;
  }

  // Alert 1: ROW_COUNT_DROP - Open warning on user analytics pipeline
  const dagRun1 = dagRuns[0];
  await prisma.alert.create({
    data: {
      organizationId,
      alertType: AlertType.ROW_COUNT_DROP,
      status: AlertStatus.OPEN,
      severity: "warning",
      srcDagId: dagRun1.srcDagId,
      captureId: `${dagRun1.srcDagId}.extract_users`,
      dagRunId: dagRun1.id,
      taskRunId: dagRun1.taskRuns[0]?.id ?? null,
      metadata: {
        baseline: 10000,
        current: 7500,
        dropPercentage: 25,
        historicalZeroRate: 0.02,
        runsAnalyzed: 10,
        threshold: "MEDIUM",
      },
    },
  });

  // Alert 2: NULL_OCCURRENCE - Acknowledged critical alert
  const dagRun2 = dagRuns[1];
  const acknowledgedAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
  await prisma.alert.create({
    data: {
      organizationId,
      alertType: AlertType.NULL_OCCURRENCE,
      status: AlertStatus.ACKNOWLEDGED,
      severity: "critical",
      srcDagId: dagRun2.srcDagId,
      captureId: `${dagRun2.srcDagId}.transform_data`,
      dagRunId: dagRun2.id,
      taskRunId: dagRun2.taskRuns[1]?.id ?? dagRun2.taskRuns[0]?.id ?? null,
      metadata: {
        affectedColumns: [
          { name: "email", nullCount: 150, dtype: "string" },
          { name: "phone_number", nullCount: 45, dtype: "string" },
        ],
        columnCount: 2,
        totalNullCount: 195,
        historicalOccurrencesAnalyzed: 15,
        sensitivity: "MEDIUM",
      },
      acknowledgedAt,
      acknowledgedBy: "seed-user",
    },
  });

  // Alert 3: SCHEMA_CHANGE - Dismissed alert (expected behavior)
  const dagRun3 = dagRuns[2];
  const dismissedAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
  await prisma.alert.create({
    data: {
      organizationId,
      alertType: AlertType.SCHEMA_CHANGE,
      status: AlertStatus.DISMISSED,
      severity: "warning",
      srcDagId: dagRun3.srcDagId,
      captureId: `${dagRun3.srcDagId}.load_warehouse`,
      dagRunId: dagRun3.id,
      taskRunId: dagRun3.taskRuns[2]?.id ?? dagRun3.taskRuns[0]?.id ?? null,
      metadata: {
        addedColumns: [
          { name: "phone_number", type: "string" },
          { name: "created_at", type: "datetime" },
        ],
        removedColumns: [
          { name: "legacy_id", type: "integer" },
        ],
        typeChangedColumns: [
          { name: "age", previousType: "string", currentType: "integer" },
        ],
        summary: {
          addedCount: 2,
          removedCount: 1,
          typeChangedCount: 1,
          totalChanges: 4,
        },
        previousColumnCount: 8,
        currentColumnCount: 9,
        sensitivity: "MEDIUM",
      },
      dismissedAt,
      dismissedBy: "seed-user",
      dismissReason: "expected_behavior",
    },
  });

  console.log("✅ Created 3 sample alerts (ROW_COUNT_DROP, NULL_OCCURRENCE, SCHEMA_CHANGE)");
}
