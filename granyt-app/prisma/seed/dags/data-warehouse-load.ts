import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo } from "../utils";

/**
 * DAG 11: Data Warehouse Load
 * Demonstrates performance degradation over time (slow degradation scenario)
 */
export async function seedDataWarehouseLoadDAG(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  const dag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "data_warehouse_load",
      namespace: "airflow",
      description: "Data warehouse load - performance degrading over time",
      schedule: "@daily",
    },
  });

  const env = "production";

  // Performance degrades over time
  for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
    const runStartTime = hoursAgo(dayOffset * 24 + 3);
    const runId = `scheduled__${runStartTime.toISOString()}`;

    // Duration increases over time (simulating growing data or degrading performance)
    const baseDuration = 600; // 10 minutes initially
    const durationIncrease = (14 - dayOffset) * 120; // Adds 2 min per day
    const totalDuration = baseDuration + durationIncrease;

    // Row count stays roughly the same
    const rowCount = 200000 + Math.floor(Math.random() * 10000);
    
    // Custom metrics for this run
    const runMetrics = {
      rows_per_second: Math.floor(rowCount / totalDuration),
      memory_peak_mb: 2048 + (14 - dayOffset) * 128,
    };

    const endTime = new Date(runStartTime.getTime() + totalDuration * 1000);
    const dagRun = await prisma.dagRun.create({
      data: {
        organizationId,
        srcDagId: dag.srcDagId,
        srcRunId: runId,
        namespace: "airflow",
        environment: env,
        startTime: runStartTime,
        endTime,
        duration: totalDuration,
        runType: "scheduled",
        status: DagRunStatus.SUCCESS,
      },
    });

    const taskStart = new Date(runStartTime.getTime() + 1000);
    const taskRun = await prisma.taskRun.create({
      data: {
        organizationId,
        dagRunId: dagRun.id,
        srcTaskId: "load_data",
        environment: env,
        status: "success",
        startTime: taskStart,
        endTime: new Date(taskStart.getTime() + (totalDuration - 60) * 1000),
        duration: totalDuration - 60,
        operator: "PythonOperator",
      },
    });

    await prisma.metric.create({
      data: {
        organizationId,
        captureId: "data_warehouse_load.load_data",
        taskRunId: taskRun.id,
        metrics: {
          row_count: rowCount,
          column_count: 25,
          memory_bytes: rowCount * 200,
          dataframe_type: "pandas",
          columns: [
            { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
            { name: "event_type", dtype: "object", null_count: 0, empty_string_count: 0 },
            { name: "event_data", dtype: "object", null_count: 100, empty_string_count: 50 },
            { name: "timestamp", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
            { name: "user_id", dtype: "int64", null_count: 500, empty_string_count: null },
          ],
          upstream: null,
          load_duration_seconds: totalDuration - 60,
          batch_count: Math.ceil(rowCount / 10000),
          ...runMetrics,
        },
        capturedAt: new Date(taskStart.getTime() + (totalDuration - 120) * 1000),
      },
    });
  }

  console.log("✅ Created DAG 11 (data_warehouse_load) - slow degradation:");
  console.log("   - 15 days of runs with increasing duration");
  console.log("   - Day 1: ~10 min, Day 15: ~38 min (performance degrading)");
  console.log("   - rows_per_second metric shows declining throughput");
}
