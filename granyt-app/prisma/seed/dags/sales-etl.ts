import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo } from "../utils";

/**
 * DAG 2: Sales ETL DAG
 * Demonstrates upstream lineage tracking (explicit dependencies)
 */
export async function seedSalesEtlDAG(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  const dag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "sales_etl_pipeline",
      namespace: "airflow",
      description: "Sales ETL pipeline - demonstrates upstream lineage tracking",
      schedule: "@hourly",
    },
  });

  // Create runs in all environments
  for (const env of ["production", "development", "staging"]) {
    for (let runIndex = 0; runIndex < 3; runIndex++) {
      const envOffset = env === "production" ? 6 : env === "staging" ? 3 : 0;
      const runStartTime = hoursAgo(12 * (3 - runIndex) + envOffset);
      const runId = `scheduled__${runStartTime.toISOString()}`;

      const endTime = new Date(runStartTime.getTime() + 20 * 60 * 1000);
      const dagRun = await prisma.dagRun.create({
        data: {
          organizationId,
          srcDagId: dag.srcDagId,
          srcRunId: runId,
          namespace: "airflow",
          environment: env,
          startTime: runStartTime,
          endTime,
          duration: 1200,
          runType: "scheduled",
          status: DagRunStatus.SUCCESS,
        },
      });

      // Task A: Extract orders (runs first)
      const taskAStart = new Date(runStartTime.getTime() + 1000);
      const taskRunA = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "extract_orders",
          environment: env,
          status: "success",
          startTime: taskAStart,
          endTime: new Date(taskAStart.getTime() + 4 * 60 * 1000),
          duration: 240,
          operator: "PythonOperator",
        },
      });

      // Task B: Extract products (runs in PARALLEL with A)
      const taskBStart = new Date(runStartTime.getTime() + 2000);
      const taskRunB = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "extract_products",
          environment: env,
          status: "success",
          startTime: taskBStart,
          endTime: new Date(taskBStart.getTime() + 3 * 60 * 1000),
          duration: 180,
          operator: "PythonOperator",
        },
      });

      // Task C: Join orders with products (depends on BOTH A and B)
      const taskCStart = new Date(taskAStart.getTime() + 4 * 60 * 1000 + 5000);
      const taskRunC = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "join_data",
          environment: env,
          status: "success",
          startTime: taskCStart,
          endTime: new Date(taskCStart.getTime() + 6 * 60 * 1000),
          duration: 360,
          operator: "PythonOperator",
        },
      });

      // Task D: Calculate metrics (depends on C)
      const taskDStart = new Date(taskCStart.getTime() + 6 * 60 * 1000 + 5000);
      const taskRunD = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "calculate_metrics",
          environment: env,
          status: "success",
          startTime: taskDStart,
          endTime: new Date(taskDStart.getTime() + 5 * 60 * 1000),
          duration: 300,
          operator: "PythonOperator",
        },
      });

      // Data metrics with explicit upstream dependencies
      const orderCount = 5000 + runIndex * 200;
      const productCount = 500;

      // Task A: Extract orders (source - no upstream)
      const orderColumns = [
        { name: "order_id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "customer_id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "product_id", dtype: "int64", null_count: Math.floor(orderCount * 0.01), empty_string_count: null },
        { name: "quantity", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "order_date", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
        { name: "total_amount", dtype: "float64", null_count: Math.floor(orderCount * 0.005), empty_string_count: null },
      ];

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "sales_etl_pipeline.extract_orders",
          taskRunId: taskRunA.id,
          metrics: {
            row_count: orderCount,
            column_count: orderColumns.length,
            memory_bytes: orderCount * 120,
            dataframe_type: "pandas",
            columns: orderColumns,
            upstream: null,
          },
          capturedAt: new Date(taskAStart.getTime() + 3 * 60 * 1000),
        },
      });

      // Task B: Extract products (source - no upstream)
      const productColumns = [
        { name: "product_id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "product_name", dtype: "object", null_count: 0, empty_string_count: 0 },
        { name: "category", dtype: "object", null_count: Math.floor(productCount * 0.02), empty_string_count: 0 },
        { name: "price", dtype: "float64", null_count: 0, empty_string_count: null },
      ];

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "sales_etl_pipeline.extract_products",
          taskRunId: taskRunB.id,
          metrics: {
            row_count: productCount,
            column_count: productColumns.length,
            memory_bytes: productCount * 80,
            dataframe_type: "pandas",
            columns: productColumns,
            upstream: null,
          },
          capturedAt: new Date(taskBStart.getTime() + 2 * 60 * 1000),
        },
      });

      // Task C: Join data (EXPLICIT UPSTREAM)
      const joinedColumns = [
        { name: "order_id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "customer_id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "product_id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "product_name", dtype: "object", null_count: 0, empty_string_count: 0 },
        { name: "category", dtype: "object", null_count: Math.floor(orderCount * 0.02), empty_string_count: 0 },
        { name: "quantity", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "price", dtype: "float64", null_count: 0, empty_string_count: null },
        { name: "total_amount", dtype: "float64", null_count: Math.floor(orderCount * 0.005), empty_string_count: null },
        { name: "order_date", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
      ];

      const joinedRowCount = Math.floor(orderCount * 0.99);

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "sales_etl_pipeline.join_data",
          taskRunId: taskRunC.id,
          metrics: {
            row_count: joinedRowCount,
            column_count: joinedColumns.length,
            memory_bytes: joinedRowCount * 200,
            dataframe_type: "pandas",
            columns: joinedColumns,
            upstream: ["sales_etl_pipeline.extract_orders", "sales_etl_pipeline.extract_products"],
          },
          capturedAt: new Date(taskCStart.getTime() + 5 * 60 * 1000),
        },
      });

      // Task D: Calculate metrics (EXPLICIT UPSTREAM)
      const metricsColumns = [
        { name: "category", dtype: "object", null_count: 0, empty_string_count: 0 },
        { name: "total_orders", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "total_revenue", dtype: "float64", null_count: 0, empty_string_count: null },
        { name: "avg_order_value", dtype: "float64", null_count: 0, empty_string_count: null },
        { name: "unique_customers", dtype: "int64", null_count: 0, empty_string_count: null },
      ];

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "sales_etl_pipeline.calculate_metrics",
          taskRunId: taskRunD.id,
          metrics: {
            row_count: 15,
            column_count: metricsColumns.length,
            memory_bytes: 15 * 100,
            dataframe_type: "pandas",
            columns: metricsColumns,
            upstream: ["sales_etl_pipeline.join_data"],
          },
          capturedAt: new Date(taskDStart.getTime() + 4 * 60 * 1000),
        },
      });
    }
  }

  console.log("✅ Created DAG 2 (sales_etl_dag) with explicit upstream lineage");
}
