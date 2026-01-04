import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo, generateFingerprint, generateErrorId } from "../utils";

/**
 * DAG 9: Payment Processing DAG
 * Demonstrates upstream schema change breaking the DAG
 */
export async function seedPaymentProcessingDAG(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  const dag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "payment_processing_pipeline",
      namespace: "airflow",
      description: "Payment processing pipeline - source schema changed today",
      schedule: "@hourly",
    },
  });

  const schemaChangeRuns = [
    // Past runs - successful with original schema
    { offset: 5 * 24, status: "success" as const, hasSchemaChange: false },
    { offset: 4 * 24, status: "success" as const, hasSchemaChange: false },
    { offset: 3 * 24, status: "success" as const, hasSchemaChange: false },
    { offset: 2 * 24, status: "success" as const, hasSchemaChange: false },
    { offset: 1 * 24, status: "success" as const, hasSchemaChange: false },
    // Today - source schema changed, pipeline breaks
    { offset: 6, status: "failed" as const, hasSchemaChange: true },
    { offset: 3, status: "failed" as const, hasSchemaChange: true },
  ];

  const originalColumns = [
    { name: "payment_id", dtype: "int64", null_count: 0, empty_string_count: null },
    { name: "customer_id", dtype: "int64", null_count: 0, empty_string_count: null },
    { name: "amount", dtype: "float64", null_count: 0, empty_string_count: null },
    { name: "currency", dtype: "object", null_count: 0, empty_string_count: 0 },
    { name: "payment_method", dtype: "object", null_count: 50, empty_string_count: 0 },
    { name: "status", dtype: "object", null_count: 0, empty_string_count: 0 },
    { name: "created_at", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
  ];

  // New schema - breaking changes
  const newSchemaColumns = [
    { name: "payment_id", dtype: "object", null_count: 0, empty_string_count: 0 },
    { name: "customer_id", dtype: "int64", null_count: 0, empty_string_count: null },
    { name: "total_amount", dtype: "float64", null_count: 0, empty_string_count: null },
    { name: "currency_code", dtype: "object", null_count: 0, empty_string_count: 0 },
    { name: "payment_type", dtype: "object", null_count: 0, empty_string_count: 0 },
    { name: "payment_provider", dtype: "object", null_count: 100, empty_string_count: 0 },
    { name: "status", dtype: "object", null_count: 0, empty_string_count: 0 },
    { name: "created_at", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
    { name: "updated_at", dtype: "datetime64[ns]", null_count: 500, empty_string_count: null },
  ];

  // Create GeneralError for schema change failure
  const schemaErrorType = "KeyError";
  const schemaErrorMessage = "'amount'";
  const schemaFingerprintContent = `${schemaErrorType}:${schemaErrorMessage}`;
  const schemaFingerprint = generateFingerprint(schemaFingerprintContent);

  const schemaChangeError = await prisma.generalError.create({
    data: {
      organizationId,
      fingerprint: schemaFingerprint,
      exceptionType: schemaErrorType,
      message: schemaErrorMessage,
      status: "open",
      occurrenceCount: 2,
      firstSeenAt: hoursAgo(6),
      lastSeenAt: hoursAgo(3),
    },
  });

  const env = "production";

  for (const runData of schemaChangeRuns) {
    const runStartTime = hoursAgo(runData.offset);
    const runId = `scheduled__${runStartTime.toISOString()}`;

    const endTime = new Date(runStartTime.getTime() + 8 * 60 * 1000);
    const dagRun = await prisma.dagRun.create({
      data: {
        organizationId,
        srcDagId: dag.srcDagId,
        srcRunId: runId,
        namespace: "airflow",
        environment: env,
        startTime: runStartTime,
        endTime,
        duration: 480,
        runType: "scheduled",
        status: runData.status === "success" ? DagRunStatus.SUCCESS : DagRunStatus.FAILED,
      },
    });

    // Task 1: Extract payments (succeeds even with new schema)
    const task1Start = new Date(runStartTime.getTime() + 1000);
    const taskRun1 = await prisma.taskRun.create({
      data: {
        organizationId,
        dagRunId: dagRun.id,
        srcTaskId: "extract_payments",
        environment: env,
        status: "success",
        startTime: task1Start,
        endTime: new Date(task1Start.getTime() + 3 * 60 * 1000),
        duration: 180,
        operator: "PythonOperator",
      },
    });

    await prisma.metric.create({
      data: {
        organizationId,
        captureId: "payment_processing_pipeline.extract_payments",
        taskRunId: taskRun1.id,
        metrics: {
          row_count: 15000,
          column_count: runData.hasSchemaChange ? newSchemaColumns.length : originalColumns.length,
          memory_bytes: 15000 * 120,
          dataframe_type: "pandas",
          columns: runData.hasSchemaChange ? newSchemaColumns : originalColumns,
          upstream: null,
        },
        capturedAt: new Date(task1Start.getTime() + 2 * 60 * 1000),
      },
    });

    // Task 2: Transform payments (FAILS when schema changed)
    const task2Start = new Date(task1Start.getTime() + 3 * 60 * 1000 + 5000);
    const taskRun2 = await prisma.taskRun.create({
      data: {
        organizationId,
        dagRunId: dagRun.id,
        srcTaskId: "transform_payments",
        environment: env,
        status: runData.hasSchemaChange ? "failed" : "success",
        startTime: task2Start,
        endTime: new Date(task2Start.getTime() + (runData.hasSchemaChange ? 1 : 4) * 60 * 1000),
        duration: runData.hasSchemaChange ? 60 : 240,
        operator: "PythonOperator",
        errorMessage: runData.hasSchemaChange ? "KeyError: 'amount'" : null,
      },
    });

    if (runData.hasSchemaChange) {
      await prisma.errorOccurrence.create({
        data: {
          organizationId,
          generalErrorId: schemaChangeError.id,
          taskRunId: taskRun2.id,
          errorId: generateErrorId(),
          operator: "PythonOperator",
          tryNumber: 1,
          stacktrace: [
            {
              filename: "/usr/local/lib/python3.10/site-packages/pandas/core/frame.py",
              function: "__getitem__",
              lineno: 3807,
              module: "pandas.core.frame",
              source_context: [
                { lineno: 3805, code: "        if is_hashable(key):", current: false },
                { lineno: 3806, code: "            if key in self.columns:", current: false },
                { lineno: 3807, code: "                indexer = self.columns.get_loc(key)", current: true },
              ]
            },
            {
              filename: "/opt/airflow/dags/payment_processing.py",
              function: "transform_payments",
              lineno: 89,
              module: "payment_processing",
              source_context: [
                { lineno: 87, code: "def transform_payments(df):", current: false },
                { lineno: 88, code: "    logger.info('Transforming payments...')", current: false },
                { lineno: 89, code: "    df['amount_cents'] = df['amount'] * 100", current: true },
                { lineno: 90, code: "    return df", current: false },
              ],
              locals: {
                df: "<pandas.DataFrame shape=(14500, 8)>",
                key: "'amount'"
              }
            },
            {
              filename: "/usr/local/lib/python3.10/site-packages/pandas/core/indexes/base.py",
              function: "get_loc",
              lineno: 3805,
              module: "pandas.core.indexes.base",
              source_context: [
                { lineno: 3803, code: "            return self._engine.get_loc(casted_key)", current: false },
                { lineno: 3804, code: "        except KeyError as e:", current: false },
                { lineno: 3805, code: "            raise KeyError(key) from e", current: true },
              ]
            }
          ],
          timestamp: new Date(task2Start.getTime() + 30 * 1000),
        },
      });
    } else {
      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "payment_processing_pipeline.transform_payments",
          taskRunId: taskRun2.id,
          metrics: {
            row_count: 14500,
            column_count: originalColumns.length + 2,
            memory_bytes: 14500 * 140,
            dataframe_type: "pandas",
            columns: [
              ...originalColumns,
              { name: "amount_cents", dtype: "int64", null_count: 0, empty_string_count: null },
              { name: "is_refund", dtype: "bool", null_count: 0, empty_string_count: null },
            ],
            upstream: ["payment_processing_pipeline.extract_payments"],
          },
          capturedAt: new Date(task2Start.getTime() + 3 * 60 * 1000),
        },
      });
    }

    // Task 3: Load payments (only runs if transform succeeds)
    if (!runData.hasSchemaChange) {
      const task3Start = new Date(task2Start.getTime() + 4 * 60 * 1000 + 5000);
      await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "load_payments",
          environment: env,
          status: "success",
          startTime: task3Start,
          endTime: new Date(task3Start.getTime() + 2 * 60 * 1000),
          duration: 120,
          operator: "PythonOperator",
        },
      });
    }
  }

  console.log("✅ Created DAG 9 (payment_processing_dag) - source schema change:");
  console.log("   - 5 days of successful runs with original schema");
  console.log("   - Today: 2 failed runs - source schema changed");
  console.log("   - 'amount' column renamed to 'total_amount', DAG breaks with KeyError");
}
