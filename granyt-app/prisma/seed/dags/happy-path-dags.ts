import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo } from "../utils";

/**
 * 7 Perfect DAGs
 * Demonstrates various operators and metrics in a healthy state.
 */
export async function seedHappyPathDAGs(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  console.log("🌟 Seeding 7 Happy Path DAGs...");

  const dags = [
    { id: "customer_churn_prediction", desc: "Predicts customer churn using Spark ML", schedule: "@daily" },
    { id: "daily_inventory_update", desc: "Updates inventory from GCS to BigQuery", schedule: "@daily" },
    { id: "marketing_campaign_sync", desc: "Syncs marketing campaigns from Snowflake to S3", schedule: "@hourly" },
    { id: "financial_reconciliation", desc: "Reconciles financial records using dbt", schedule: "@daily" },
    { id: "user_behavior_analysis", desc: "Analyzes user behavior logs with Spark", schedule: "@daily" },
    { id: "log_aggregation_pipeline", desc: "Aggregates logs from S3 to Snowflake", schedule: "@hourly" },
    { id: "real_time_fraud_detection", desc: "Detects fraud in real-time transactions", schedule: "@hourly" },
  ];

  for (const dagInfo of dags) {
    const dag = await prisma.dag.create({
      data: {
        organizationId,
        srcDagId: dagInfo.id,
        namespace: "airflow",
        description: dagInfo.desc,
        schedule: dagInfo.schedule,
      },
    });

    const env = "production";
    const runCount = dagInfo.schedule === "@hourly" ? 24 : 7;

    for (let i = 0; i < runCount; i++) {
      const startTime = hoursAgo(dagInfo.schedule === "@hourly" ? i : i * 24);
      const runId = `scheduled__${startTime.toISOString()}`;
      const duration = 300 + Math.floor(Math.random() * 600);
      const endTime = new Date(startTime.getTime() + duration * 1000);

      const dagRun = await prisma.dagRun.create({
        data: {
          organizationId,
          srcDagId: dag.srcDagId,
          srcRunId: runId,
          namespace: "airflow",
          environment: env,
          startTime,
          endTime,
          duration,
          runType: "scheduled",
          status: DagRunStatus.SUCCESS,
        },
      });

      // Create 2-3 tasks per DAG
      await seedTasksForDag(prisma, organizationId, dagRun, dagInfo.id);
    }
    console.log(`   ✅ Created DAG: ${dagInfo.id}`);
  }
}

async function seedTasksForDag(
  prisma: PrismaClient,
  organizationId: string,
  dagRun: any,
  dagId: string
): Promise<void> {
  const env = dagRun.environment;
  const startTime = dagRun.startTime;

  if (dagId === "customer_churn_prediction") {
    // Task 1: Python
    const t1Start = new Date(startTime.getTime() + 1000);
    const t1End = new Date(t1Start.getTime() + 60000);
    const tr1 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "prepare_data", environment: env, status: "success", startTime: t1Start, endTime: t1End, operator: "PythonOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.prepare_data`, taskRunId: tr1.id, metrics: { row_count: 50000, dataframe_type: "pandas" }, capturedAt: t1End }
    });

    // Task 2: Spark
    const t2Start = new Date(t1End.getTime() + 5000);
    const t2End = new Date(t2Start.getTime() + 300000);
    const tr2 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "train_model", environment: env, status: "success", startTime: t2Start, endTime: t2End, operator: "SparkSubmitOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.train_model`, taskRunId: tr2.id, metrics: { accuracy: 0.85 + Math.random() * 0.1, shuffle_bytes: 1024 * 1024 * 100, upstream: [`${dagId}.prepare_data`] }, capturedAt: t2End }
    });
  } 
  else if (dagId === "daily_inventory_update") {
    // Task 1: GCS to BQ
    const t1Start = new Date(startTime.getTime() + 1000);
    const t1End = new Date(t1Start.getTime() + 120000);
    const tr1 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "gcs_to_bq", environment: env, status: "success", startTime: t1Start, endTime: t1End, operator: "GCSToBigQueryOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.gcs_to_bq`, taskRunId: tr1.id, metrics: { row_count: 100000, bytes_processed: 1024 * 1024 * 50 }, capturedAt: t1End }
    });

    // Task 2: BQ Insert
    const t2Start = new Date(t1End.getTime() + 5000);
    const t2End = new Date(t2Start.getTime() + 60000);
    const tr2 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "update_inventory_table", environment: env, status: "success", startTime: t2Start, endTime: t2End, operator: "BigQueryInsertJobOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.update_inventory_table`, taskRunId: tr2.id, metrics: { row_count: 100000, bytes_billed: 1024 * 1024 * 10, upstream: [`${dagId}.gcs_to_bq`] }, capturedAt: t2End }
    });
  }
  else if (dagId === "marketing_campaign_sync") {
    // Task 1: Snowflake
    const t1Start = new Date(startTime.getTime() + 1000);
    const t1End = new Date(t1Start.getTime() + 90000);
    const tr1 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "fetch_campaigns", environment: env, status: "success", startTime: t1Start, endTime: t1End, operator: "SnowflakeOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.fetch_campaigns`, taskRunId: tr1.id, metrics: { row_count: 5000, query_id: "sf-123" }, capturedAt: t1End }
    });

    // Task 2: S3 Copy
    const t2Start = new Date(t1End.getTime() + 5000);
    const t2End = new Date(t2Start.getTime() + 30000);
    const tr2 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "sync_to_s3", environment: env, status: "success", startTime: t2Start, endTime: t2End, operator: "S3CopyObjectOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.sync_to_s3`, taskRunId: tr2.id, metrics: { files_processed: 1, bytes_processed: 1024 * 500, upstream: [`${dagId}.fetch_campaigns`] }, capturedAt: t2End }
    });
  }
  else if (dagId === "financial_reconciliation") {
    // Task 1: SQL
    const t1Start = new Date(startTime.getTime() + 1000);
    const t1End = new Date(t1Start.getTime() + 60000);
    const tr1 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "check_raw_data", environment: env, status: "success", startTime: t1Start, endTime: t1End, operator: "SQLExecuteQueryOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.check_raw_data`, taskRunId: tr1.id, metrics: { row_count: 25000 }, capturedAt: t1End }
    });

    // Task 2: dbt
    const t2Start = new Date(t1End.getTime() + 5000);
    const t2End = new Date(t2Start.getTime() + 180000);
    const tr2 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "run_reconciliation", environment: env, status: "success", startTime: t2Start, endTime: t2End, operator: "DbtRunOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.run_reconciliation`, taskRunId: tr2.id, metrics: { models_run: 8, tests_passed: 20, upstream: [`${dagId}.check_raw_data`] }, capturedAt: t2End }
    });
  }
  else if (dagId === "user_behavior_analysis") {
    // Task 1: Spark
    const t1Start = new Date(startTime.getTime() + 1000);
    const t1End = new Date(t1Start.getTime() + 400000);
    const tr1 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "aggregate_logs", environment: env, status: "success", startTime: t1Start, endTime: t1End, operator: "SparkSubmitOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.aggregate_logs`, taskRunId: tr1.id, metrics: { row_count: 1000000, shuffle_bytes: 1024 * 1024 * 1024 }, capturedAt: t1End }
    });

    // Task 2: BQ
    const t2Start = new Date(t1End.getTime() + 10000);
    const t2End = new Date(t2Start.getTime() + 120000);
    const tr2 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "load_to_analytics", environment: env, status: "success", startTime: t2Start, endTime: t2End, operator: "BigQueryInsertJobOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.load_to_analytics`, taskRunId: tr2.id, metrics: { row_count: 1000000, bytes_billed: 1024 * 1024 * 200, upstream: [`${dagId}.aggregate_logs`] }, capturedAt: t2End }
    });
  }
  else if (dagId === "log_aggregation_pipeline") {
    // Task 1: S3 Transform
    const t1Start = new Date(startTime.getTime() + 1000);
    const t1End = new Date(t1Start.getTime() + 150000);
    const tr1 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "transform_logs", environment: env, status: "success", startTime: t1Start, endTime: t1End, operator: "S3FileTransformOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.transform_logs`, taskRunId: tr1.id, metrics: { files_processed: 10, bytes_processed: 1024 * 1024 * 50 }, capturedAt: t1End }
    });

    // Task 2: Snowflake
    const t2Start = new Date(t1End.getTime() + 5000);
    const t2End = new Date(t2Start.getTime() + 60000);
    const tr2 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "load_to_snowflake", environment: env, status: "success", startTime: t2Start, endTime: t2End, operator: "SnowflakeOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.load_to_snowflake`, taskRunId: tr2.id, metrics: { row_count: 500000, upstream: [`${dagId}.transform_logs`] }, capturedAt: t2End }
    });
  }
  else if (dagId === "real_time_fraud_detection") {
    // Task 1: Python
    const t1Start = new Date(startTime.getTime() + 1000);
    const t1End = new Date(t1Start.getTime() + 10000);
    const tr1 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "check_fraud", environment: env, status: "success", startTime: t1Start, endTime: t1End, operator: "PythonOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.check_fraud`, taskRunId: tr1.id, metrics: { fraud_detected: 0, transactions_checked: 100 }, capturedAt: t1End }
    });

    // Task 2: GCS
    const t2Start = new Date(t1End.getTime() + 2000);
    const t2End = new Date(t2Start.getTime() + 5000);
    const tr2 = await prisma.taskRun.create({
      data: { organizationId, dagRunId: dagRun.id, srcTaskId: "archive_results", environment: env, status: "success", startTime: t2Start, endTime: t2End, operator: "GCSCreateBucketOperator" }
    });
    await prisma.metric.create({
      data: { organizationId, captureId: `${dagId}.archive_results`, taskRunId: tr2.id, metrics: { region: "us-east1", upstream: [`${dagId}.check_fraud`] }, capturedAt: t2End }
    });
  }
}
