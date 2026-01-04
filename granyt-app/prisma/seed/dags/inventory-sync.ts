import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo } from "../utils";

/**
 * DAG 7: Inventory Sync DAG
 * Demonstrates row count dropping to 0 (dead source database scenario)
 */
export async function seedInventorySyncDAG(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  const dag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "inventory_sync_pipeline",
      namespace: "airflow",
      description: "Inventory sync pipeline - source database suddenly stopped returning data",
      schedule: "@hourly",
    },
  });

  // Historical successful runs with high row counts, then sudden drop to 0
  const inventoryHistoryRuns = [
    { offset: 7 * 24, rowCount: 125000, status: "success" as const },
    { offset: 6 * 24, rowCount: 127500, status: "success" as const },
    { offset: 5 * 24, rowCount: 126800, status: "success" as const },
    { offset: 4 * 24, rowCount: 128200, status: "success" as const },
    { offset: 3 * 24, rowCount: 129000, status: "success" as const },
    { offset: 2 * 24, rowCount: 127900, status: "success" as const },
    { offset: 1 * 24, rowCount: 128500, status: "success" as const },
    // Today: sudden drop to 0 rows - no error, just empty result
    { offset: 12, rowCount: 0, status: "success" as const },
    { offset: 6, rowCount: 0, status: "success" as const },
    { offset: 1, rowCount: 0, status: "success" as const },
  ];

  const normalColumns = [
    { name: "sku", dtype: "object", null_count: 0, empty_string_count: 0 },
    { name: "product_name", dtype: "object", null_count: 50, empty_string_count: 10 },
    { name: "quantity", dtype: "int64", null_count: 0, empty_string_count: null },
    { name: "warehouse_id", dtype: "int64", null_count: 0, empty_string_count: null },
    { name: "location", dtype: "object", null_count: 100, empty_string_count: 20 },
    { name: "last_updated", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
    { name: "min_stock", dtype: "int64", null_count: 200, empty_string_count: null },
    { name: "max_stock", dtype: "int64", null_count: 200, empty_string_count: null },
  ];

  const env = "production";

  for (const runData of inventoryHistoryRuns) {
    const runStartTime = hoursAgo(runData.offset);
    const runId = `scheduled__${runStartTime.toISOString()}`;

    const endTime = new Date(runStartTime.getTime() + 5 * 60 * 1000);
    const dagRun = await prisma.dagRun.create({
      data: {
        organizationId,
        srcDagId: dag.srcDagId,
        srcRunId: runId,
        namespace: "airflow",
        environment: env,
        startTime: runStartTime,
        endTime,
        duration: 300,
        runType: "scheduled",
        status: runData.status === "success" ? DagRunStatus.SUCCESS : DagRunStatus.FAILED,
      },
    });

    const taskStart = new Date(runStartTime.getTime() + 1000);
    const taskRun = await prisma.taskRun.create({
      data: {
        organizationId,
        dagRunId: dagRun.id,
        srcTaskId: "sync_inventory",
        environment: env,
        status: runData.status,
        startTime: taskStart,
        endTime: new Date(taskStart.getTime() + 4 * 60 * 1000),
        duration: 240,
        operator: "PythonOperator",
      },
    });

    await prisma.metric.create({
      data: {
        organizationId,
        captureId: "inventory_sync_pipeline.sync_inventory",
        taskRunId: taskRun.id,
        metrics: {
          row_count: runData.rowCount,
          column_count: 8,
          memory_bytes: runData.rowCount * 64,
          dataframe_type: "pandas",
          columns: runData.rowCount > 0 ? normalColumns : [],
          upstream: null,
        },
        capturedAt: new Date(taskStart.getTime() + 3 * 60 * 1000),
      },
    });
  }

  console.log("✅ Created DAG 7 (inventory_sync_dag) - dead source scenario:");
  console.log("   - 7 days of successful runs with ~125k-129k rows each");
  console.log("   - Today: 3 runs with 0 rows (no error thrown)");
  console.log("   - Simulates source database being emptied/misconfigured");
}
