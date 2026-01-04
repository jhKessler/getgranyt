import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo } from "../utils";

/**
 * DAG 8: Daily Report DAG
 * Demonstrates consistently successful, happy path scenario
 */
export async function seedDailyReportDAG(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  const dag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "daily_report_pipeline",
      namespace: "airflow",
      description: "Daily reporting pipeline - consistently successful",
      schedule: "@daily",
    },
  });

  const env = "production";

  // Create 15 days of successful runs
  for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
    const runStartTime = hoursAgo(dayOffset * 24 + 8);
    const runId = `scheduled__${runStartTime.toISOString()}`;
    const baseRowCount = 50000 + Math.floor(Math.random() * 5000);

    const endTime = new Date(runStartTime.getTime() + 12 * 60 * 1000);
    const dagRun = await prisma.dagRun.create({
      data: {
        organizationId,
        srcDagId: dag.srcDagId,
        srcRunId: runId,
        namespace: "airflow",
        environment: env,
        startTime: runStartTime,
        endTime,
        duration: 720,
        runType: "scheduled",
        status: DagRunStatus.SUCCESS,
      },
    });

    // Task 1: Aggregate metrics
    const task1Start = new Date(runStartTime.getTime() + 1000);
    const taskRun1 = await prisma.taskRun.create({
      data: {
        organizationId,
        dagRunId: dagRun.id,
        srcTaskId: "aggregate_metrics",
        environment: env,
        status: "success",
        startTime: task1Start,
        endTime: new Date(task1Start.getTime() + 5 * 60 * 1000),
        duration: 300,
        operator: "PythonOperator",
      },
    });

    await prisma.metric.create({
      data: {
        organizationId,
        captureId: "daily_report_pipeline.aggregate_metrics",
        taskRunId: taskRun1.id,
        metrics: {
          row_count: baseRowCount,
          column_count: 12,
          memory_bytes: baseRowCount * 96,
          dataframe_type: "pandas",
          columns: [
            { name: "date", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
            { name: "region", dtype: "object", null_count: 0, empty_string_count: 0 },
            { name: "total_sales", dtype: "float64", null_count: 0, empty_string_count: null },
            { name: "order_count", dtype: "int64", null_count: 0, empty_string_count: null },
            { name: "avg_order_value", dtype: "float64", null_count: 0, empty_string_count: null },
            { name: "unique_customers", dtype: "int64", null_count: 0, empty_string_count: null },
          ],
          upstream: null,
        },
        capturedAt: new Date(task1Start.getTime() + 4 * 60 * 1000),
      },
    });

    // Task 2: Generate report
    const task2Start = new Date(task1Start.getTime() + 5 * 60 * 1000 + 5000);
    const taskRun2 = await prisma.taskRun.create({
      data: {
        organizationId,
        dagRunId: dagRun.id,
        srcTaskId: "generate_report",
        environment: env,
        status: "success",
        startTime: task2Start,
        endTime: new Date(task2Start.getTime() + 3 * 60 * 1000),
        duration: 180,
        operator: "PythonOperator",
      },
    });

    await prisma.metric.create({
      data: {
        organizationId,
        captureId: "daily_report_pipeline.generate_report",
        taskRunId: taskRun2.id,
        metrics: {
          row_count: 50,
          column_count: 8,
          memory_bytes: 50 * 200,
          dataframe_type: "pandas",
          columns: [
            { name: "metric_name", dtype: "object", null_count: 0, empty_string_count: 0 },
            { name: "value", dtype: "float64", null_count: 0, empty_string_count: null },
            { name: "change_pct", dtype: "float64", null_count: 5, empty_string_count: null },
            { name: "trend", dtype: "object", null_count: 0, empty_string_count: 0 },
          ],
          upstream: ["daily_report_pipeline.aggregate_metrics"],
        },
        capturedAt: new Date(task2Start.getTime() + 2 * 60 * 1000),
      },
    });

    // Task 3: Send notifications
    const task3Start = new Date(task2Start.getTime() + 3 * 60 * 1000 + 5000);
    await prisma.taskRun.create({
      data: {
        organizationId,
        dagRunId: dagRun.id,
        srcTaskId: "send_notifications",
        environment: env,
        status: "success",
        startTime: task3Start,
        endTime: new Date(task3Start.getTime() + 1 * 60 * 1000),
        duration: 60,
        operator: "PythonOperator",
      },
    });
  }

  console.log("✅ Created DAG 8 (daily_report_dag) - successful happy path:");
  console.log("   - 15 days of successful runs");
  console.log("   - 3 tasks: aggregate_metrics → generate_report → send_notifications");
  console.log("   - Consistent row counts with natural variation");
}
