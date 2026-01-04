import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo } from "../utils";

/**
 * DAG 1: User Analytics DAG
 * Demonstrates time-based ordering (no upstream specified)
 */
export async function seedUserAnalyticsDAG(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  const dag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "user_analytics_pipeline",
      namespace: "airflow",
      description: "User analytics pipeline - demonstrates time-based ordering",
      schedule: "@daily",
    },
  });

  // Create runs for DAG 1 in all environments
  for (const env of ["production", "development", "staging"]) {
    for (let runIndex = 0; runIndex < 3; runIndex++) {
      const envOffset = env === "production" ? 6 : env === "staging" ? 3 : 0;
      const runStartTime = hoursAgo(24 * (3 - runIndex) + envOffset);
      const runId = `scheduled__${runStartTime.toISOString()}`;

      const endTime = new Date(runStartTime.getTime() + 15 * 60 * 1000);
      const dagRun = await prisma.dagRun.create({
        data: {
          organizationId,
          srcDagId: dag.srcDagId,
          srcRunId: runId,
          namespace: "airflow",
          environment: env,
          startTime: runStartTime,
          endTime,
          duration: 900,
          runType: "scheduled",
          status: DagRunStatus.SUCCESS,
        },
      });

      // Task 1: Extract users (runs first)
      const task1Start = new Date(runStartTime.getTime() + 1000);
      const taskRun1 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "extract_users",
          environment: env,
          status: "success",
          startTime: task1Start,
          endTime: new Date(task1Start.getTime() + 3 * 60 * 1000),
          duration: 180,
          operator: "PythonOperator",
        },
      });

      // Task 2: Transform data (runs after extract)
      const task2Start = new Date(task1Start.getTime() + 3 * 60 * 1000 + 5000);
      const taskRun2 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "transform_data",
          environment: env,
          status: "success",
          startTime: task2Start,
          endTime: new Date(task2Start.getTime() + 5 * 60 * 1000),
          duration: 300,
          operator: "PythonOperator",
        },
      });

      // Task 3: Load to warehouse (runs after transform)
      const task3Start = new Date(task2Start.getTime() + 5 * 60 * 1000 + 5000);
      const taskRun3 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "load_warehouse",
          environment: env,
          status: "success",
          startTime: task3Start,
          endTime: new Date(task3Start.getTime() + 4 * 60 * 1000),
          duration: 240,
          operator: "PythonOperator",
        },
      });

      // Data metrics - row counts vary slightly between runs
      const baseRowCount = 10000 + runIndex * 500;

      // Simulate some schema changes in run 3
      const baseColumns = [
        { name: "user_id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "email", dtype: "object", null_count: Math.floor(baseRowCount * 0.02), empty_string_count: 0 },
        { name: "name", dtype: "object", null_count: Math.floor(baseRowCount * 0.01), empty_string_count: Math.floor(baseRowCount * 0.005) },
        { name: "created_at", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
      ];

      // Add extra column in later runs (schema evolution)
      if (runIndex >= 2) {
        baseColumns.push({ name: "phone_number", dtype: "object", null_count: Math.floor(baseRowCount * 0.3), empty_string_count: Math.floor(baseRowCount * 0.1) });
      }

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "user_analytics_pipeline.extract_users",
          taskRunId: taskRun1.id,
          metrics: {
            row_count: baseRowCount,
            column_count: baseColumns.length,
            memory_bytes: baseRowCount * 150,
            dataframe_type: "pandas",
            columns: baseColumns,
            upstream: null,
          },
          capturedAt: new Date(task1Start.getTime() + 2 * 60 * 1000),
        },
      });

      // After transform - fewer rows (filtered), more columns (enriched)
      const transformedColumns = [
        ...baseColumns,
        { name: "is_active", dtype: "bool", null_count: 0, empty_string_count: null },
        { name: "signup_source", dtype: "object", null_count: Math.floor(baseRowCount * 0.05), empty_string_count: 0 },
      ];

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "user_analytics_pipeline.transform_data",
          taskRunId: taskRun2.id,
          metrics: {
            row_count: Math.floor(baseRowCount * 0.85),
            column_count: transformedColumns.length,
            memory_bytes: Math.floor(baseRowCount * 0.85) * 180,
            dataframe_type: "pandas",
            columns: transformedColumns,
            upstream: null,
          },
          capturedAt: new Date(task2Start.getTime() + 4 * 60 * 1000),
        },
      });

      // After load - same data as transform output
      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "user_analytics_pipeline.load_warehouse",
          taskRunId: taskRun3.id,
          metrics: {
            row_count: Math.floor(baseRowCount * 0.85),
            column_count: transformedColumns.length,
            memory_bytes: Math.floor(baseRowCount * 0.85) * 180,
            dataframe_type: "pandas",
            columns: transformedColumns,
            upstream: null,
          },
          capturedAt: new Date(task3Start.getTime() + 3 * 60 * 1000),
        },
      });
    }
  }

  console.log("✅ Created DAG 1 (user_analytics_dag) with time-based ordering");
}
