import { PrismaClient, DagRunStatus, AlertType, AlertStatus } from "@prisma/client";
import { hoursAgo, generateFingerprint, generateErrorId } from "../utils";

/**
 * DAGs 12 & 13: Airflow Full Suite
 * Demonstrates a wide variety of operators, shared errors, and complex lineage.
 */
export async function seedAirflowFullSuiteDAGs(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  console.log("🚀 Seeding Airflow Full Suite DAGs...");

  // 1. Create the DAGs
  const marketingDag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "marketing_analytics_pipeline",
      namespace: "airflow",
      description: "Marketing analytics - S3 to Snowflake to Spark to BigQuery",
      schedule: "@daily",
    },
  });

  const salesDag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "sales_reporting_pipeline",
      namespace: "airflow",
      description: "Sales reporting - GCS to BigQuery to Spark",
      schedule: "@daily",
    },
  });

  // 2. Create a shared Spark error
  const sparkErrorType = "pyspark.sql.utils.AnalysisException";
  const sparkErrorMessage = "[TABLE_OR_VIEW_NOT_FOUND] The table or view `raw_data`.`incoming_events` cannot be found. Verify the spelling and correctness of the schema and catalog.";
  const sparkStacktrace = `Traceback (most recent call last):
  File "/opt/spark/work-dir/process_events.py", line 42, in <module>
    df = spark.read.table("raw_data.incoming_events")
  File "/opt/spark/python/lib/pyspark.zip/pyspark/sql/readwriter.py", line 382, in table
  File "/opt/spark/python/lib/py4j-0.10.9.7-src.zip/py4j/java_gateway.py", line 1322, in __call__
  File "/opt/spark/python/lib/pyspark.zip/pyspark/errors/exceptions/captured.py", line 175, in deco
pyspark.sql.utils.AnalysisException: [TABLE_OR_VIEW_NOT_FOUND] The table or view \`raw_data\`.\`incoming_events\` cannot be found. Verify the spelling and correctness of the schema and catalog.`;

  const fingerprint = generateFingerprint(`${sparkErrorType}:${sparkErrorMessage}`);

  const sharedSparkError = await prisma.generalError.create({
    data: {
      organizationId,
      fingerprint,
      exceptionType: sparkErrorType,
      message: sparkErrorMessage,
      status: "open",
      occurrenceCount: 0, // Will be updated as we add occurrences
      firstSeenAt: hoursAgo(48),
      lastSeenAt: hoursAgo(2),
    },
  });

  let totalOccurrences = 0;

  // 3. Seed runs for Marketing Pipeline
  for (const env of ["production", "staging", "development"]) {
    for (let i = 0; i < 5; i++) {
      const isLatestProd = env === "production" && i === 0;
      const startTime = hoursAgo(24 * i + (env === "production" ? 2 : 5));
      const runId = `scheduled__${startTime.toISOString()}`;
      
      const dagRun = await prisma.dagRun.create({
        data: {
          organizationId,
          srcDagId: marketingDag.srcDagId,
          srcRunId: runId,
          namespace: "airflow",
          environment: env,
          startTime,
          status: isLatestProd ? DagRunStatus.FAILED : DagRunStatus.SUCCESS,
          runType: "scheduled",
        },
      });

      // Task 1: S3 to Snowflake
      const t1Start = new Date(startTime.getTime() + 1000);
      const t1End = new Date(t1Start.getTime() + 120000);
      const task1 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "extract_from_s3",
          environment: env,
          status: "success",
          startTime: t1Start,
          endTime: t1End,
          operator: "S3ToSnowflakeOperator",
        },
      });

      // Anomaly for latest prod: 40% drop in rows
      const baseRows = 100000;
      const rowCount = isLatestProd ? 60000 : baseRows + Math.floor(Math.random() * 5000);

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: `${marketingDag.srcDagId}.extract_from_s3`,
          taskRunId: task1.id,
          metrics: {
            row_count: rowCount,
            query_id: `01b23456-0000-1234-0000-${Math.floor(Math.random() * 100000)}`,
            database: "MARKETING_DB",
            schema: "RAW",
            table: "S3_INGEST",
          },
          capturedAt: t1End,
        },
      });

      // Task 2: dbt transformation
      const t2Start = new Date(t1End.getTime() + 5000);
      const t2End = new Date(t2Start.getTime() + 300000);
      const task2 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "transform_marketing_data",
          environment: env,
          status: "success",
          startTime: t2Start,
          endTime: t2End,
          operator: "DbtRunOperator",
        },
      });

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: `${marketingDag.srcDagId}.transform_marketing_data`,
          taskRunId: task2.id,
          metrics: {
            models_run: 12,
            tests_passed: 45,
            tests_failed: 0,
            upstream: [`${marketingDag.srcDagId}.extract_from_s3`],
          },
          capturedAt: t2End,
        },
      });

      // Task 3: Spark Processing (Fails in latest prod)
      const t3Start = new Date(t2End.getTime() + 5000);
      const t3End = isLatestProd ? new Date(t3Start.getTime() + 45000) : new Date(t3Start.getTime() + 600000);
      const task3 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "process_with_spark",
          environment: env,
          status: isLatestProd ? "failed" : "success",
          startTime: t3Start,
          endTime: t3End,
          operator: "SparkSubmitOperator",
          errorMessage: isLatestProd ? sparkErrorMessage : null,
        },
      });

      if (isLatestProd) {
        await prisma.errorOccurrence.create({
          data: {
            organizationId,
            generalErrorId: sharedSparkError.id,
            taskRunId: task3.id,
            errorId: generateErrorId(),
            stacktrace: [
              {
                filename: "/opt/spark/python/lib/pyspark.zip/pyspark/sql/readwriter.py",
                function: "table",
                lineno: 382,
                module: "pyspark.sql.readwriter",
                source_context: [
                  { lineno: 380, code: "        if not isinstance(tableName, str):", current: false },
                  { lineno: 381, code: "            throw TypeError('tableName should be a string')", current: false },
                  { lineno: 382, code: "        return self._df(self._jreader.table(tableName))", current: true },
                ]
              },
              {
                filename: "/opt/spark/work-dir/process_events.py",
                function: "<module>",
                lineno: 42,
                module: "__main__",
                source_context: [
                  { lineno: 40, code: "spark = SparkSession.builder.getOrCreate()", current: false },
                  { lineno: 41, code: "logger.info('Reading incoming events...')", current: false },
                  { lineno: 42, code: "df = spark.read.table('raw_data.incoming_events')", current: true },
                  { lineno: 43, code: "df.write.mode('overwrite').saveAsTable('processed_events')", current: false },
                ],
                locals: {
                  tableName: "'raw_data.incoming_events'",
                  spark: "<pyspark.sql.session.SparkSession object>"
                }
              }
            ],
            timestamp: t3End,
          },
        });
        totalOccurrences++;
      } else {
        await prisma.metric.create({
          data: {
            organizationId,
            captureId: `${marketingDag.srcDagId}.process_with_spark`,
            taskRunId: task3.id,
            metrics: {
              shuffle_bytes: 1024 * 1024 * 512,
              row_count: rowCount,
              upstream: [`${marketingDag.srcDagId}.transform_marketing_data`],
            },
            capturedAt: t3End,
          },
        });
      }

      // Update DagRun end time
      await prisma.dagRun.update({
        where: { id: dagRun.id },
        data: { endTime: t3End, duration: Math.floor((t3End.getTime() - startTime.getTime()) / 1000) },
      });

      // Create Alerts for latest prod
      if (isLatestProd) {
        // 1. Open Alert: Row Count Drop
        await prisma.alert.create({
          data: {
            organizationId,
            alertType: AlertType.ROW_COUNT_DROP,
            status: AlertStatus.OPEN,
            severity: "warning",
            srcDagId: marketingDag.srcDagId,
            captureId: `${marketingDag.srcDagId}.extract_from_s3`,
            dagRunId: dagRun.id,
            taskRunId: task1.id,
            metadata: {
              baseline: baseRows,
              current: rowCount,
              dropPercentage: 40,
              threshold: "MEDIUM",
            },
          },
        });
      }
    }
  }

  // 4. Seed runs for Sales Pipeline
  for (const env of ["production", "staging"]) {
    for (let i = 0; i < 3; i++) {
      const isLatestProd = env === "production" && i === 0;
      const startTime = hoursAgo(24 * i + 4);
      const runId = `scheduled__${startTime.toISOString()}`;

      const dagRun = await prisma.dagRun.create({
        data: {
          organizationId,
          srcDagId: salesDag.srcDagId,
          srcRunId: runId,
          namespace: "airflow",
          environment: env,
          startTime,
          status: isLatestProd ? DagRunStatus.FAILED : DagRunStatus.SUCCESS,
          runType: "scheduled",
        },
      });

      // Task 1: GCS to BigQuery
      const t1Start = new Date(startTime.getTime() + 1000);
      const t1End = new Date(t1Start.getTime() + 180000);
      const task1 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "load_to_bq",
          environment: env,
          status: "success",
          startTime: t1Start,
          endTime: t1End,
          operator: "GCSToBigQueryOperator",
        },
      });

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: `${salesDag.srcDagId}.load_to_bq`,
          taskRunId: task1.id,
          metrics: {
            bytes_billed: 1024 * 1024 * 100,
            row_count: 50000,
            query_id: `bq-job-${Math.floor(Math.random() * 100000)}`,
          },
          capturedAt: t1End,
        },
      });

      // Task 2: Spark Processing (Fails in latest prod with SAME error)
      const t2Start = new Date(t1End.getTime() + 5000);
      const t2End = isLatestProd ? new Date(t2Start.getTime() + 30000) : new Date(t2Start.getTime() + 400000);
      const task2 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "process_sales_spark",
          environment: env,
          status: isLatestProd ? "failed" : "success",
          startTime: t2Start,
          endTime: t2End,
          operator: "SparkSubmitOperator",
          errorMessage: isLatestProd ? sparkErrorMessage : null,
        },
      });

      if (isLatestProd) {
        await prisma.errorOccurrence.create({
          data: {
            organizationId,
            generalErrorId: sharedSparkError.id,
            taskRunId: task2.id,
            errorId: generateErrorId(),
            stacktrace: [
              {
                filename: "/opt/spark/python/lib/pyspark.zip/pyspark/sql/readwriter.py",
                function: "table",
                lineno: 382,
                module: "pyspark.sql.readwriter",
                source_context: [
                  { lineno: 380, code: "        if not isinstance(tableName, str):", current: false },
                  { lineno: 381, code: "            throw TypeError('tableName should be a string')", current: false },
                  { lineno: 382, code: "        return self._df(self._jreader.table(tableName))", current: true },
                ]
              },
              {
                filename: "/opt/spark/work-dir/process_sales.py",
                function: "<module>",
                lineno: 28,
                module: "__main__",
                source_context: [
                  { lineno: 26, code: "spark = SparkSession.builder.getOrCreate()", current: false },
                  { lineno: 27, code: "logger.info('Processing sales data...')", current: false },
                  { lineno: 28, code: "df = spark.read.table('raw_data.incoming_events')", current: true },
                  { lineno: 29, code: "df.groupBy('category').sum('amount').show()", current: false },
                ],
                locals: {
                  tableName: "'raw_data.incoming_events'",
                  spark: "<pyspark.sql.session.SparkSession object>"
                }
              }
            ],
            timestamp: t2End,
          },
        });
        totalOccurrences++;
      }

      // Update DagRun end time
      await prisma.dagRun.update({
        where: { id: dagRun.id },
        data: { endTime: t2End, duration: Math.floor((t2End.getTime() - startTime.getTime()) / 1000) },
      });

      // Create Acknowledged Alert for Sales
      if (isLatestProd) {
        await prisma.alert.create({
          data: {
            organizationId,
            alertType: AlertType.INTEGRATION_ERROR,
            status: AlertStatus.ACKNOWLEDGED,
            severity: "critical",
            srcDagId: salesDag.srcDagId,
            captureId: `${salesDag.srcDagId}.process_sales_spark`,
            dagRunId: dagRun.id,
            taskRunId: task2.id,
            metadata: {
              errorType: sparkErrorType,
              message: sparkErrorMessage,
            },
            acknowledgedAt: hoursAgo(1),
            acknowledgedBy: "seed-user",
          },
        });
      }
    }
  }

  // Update the shared error count
  await prisma.generalError.update({
    where: { id: sharedSparkError.id },
    data: { occurrenceCount: totalOccurrences },
  });

  console.log(`✅ Created Airflow Full Suite with ${totalOccurrences} shared Spark errors across 2 DAGs.`);
}
