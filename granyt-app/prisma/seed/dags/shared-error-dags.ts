import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo, generateFingerprint, generateErrorId } from "../utils";

/**
 * DAGs 5 & 6: Shared Error DAGs
 * Demonstrates fingerprinted error grouping across multiple DAGs
 */
export async function seedSharedErrorDAGs(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  const dag5 = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "customer_sync_pipeline",
      namespace: "airflow",
      description: "Customer sync pipeline - shares database connection errors with order sync",
      schedule: "@hourly",
    },
  });

  const dag6 = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "order_sync_pipeline",
      namespace: "airflow",
      description: "Order sync pipeline - shares database connection errors with customer sync",
      schedule: "@hourly",
    },
  });

  // Create a shared GeneralError that both pipelines will reference
  const sharedErrorType = "psycopg2.OperationalError";
  const sharedErrorMessageNormalized = "could not connect to server: Connection refused\n\tIs the server running on host \"postgres-primary.internal\" and accepting TCP/IP connections on port <NUM>?";
  const fingerprintContent = `${sharedErrorType}:${sharedErrorMessageNormalized.substring(0, 200)}`;
  const sharedFingerprint = generateFingerprint(fingerprintContent);

  const sharedGeneralError = await prisma.generalError.create({
    data: {
      organizationId,
      fingerprint: sharedFingerprint,
      exceptionType: sharedErrorType,
      message: "could not connect to server: Connection refused\n\tIs the server running on host \"postgres-primary.internal\" and accepting TCP/IP connections on port 5432?",
      status: "resolved",
      occurrenceCount: 4,
      firstSeenAt: hoursAgo(6),
      lastSeenAt: hoursAgo(1),
    },
  });

  // Create runs for DAG 5 (customer_sync_pipeline) with errors
  await seedCustomerSyncErrors(prisma, organizationId, dag5.srcDagId, sharedGeneralError.id);
  
  // Create runs for DAG 6 (order_sync_pipeline) with the SAME shared error
  await seedOrderSyncErrors(prisma, organizationId, dag6.srcDagId, sharedGeneralError.id);

  console.log("✅ Created DAGs 5 & 6 (customer_sync_pipeline, order_sync_pipeline) with shared error:");
  console.log("   - Both DAGs fail with the same psycopg2.OperationalError");
  console.log("   - Errors are fingerprinted together (same GeneralError)");
  console.log("   - 4 total occurrences across 2 DAGs");
}

async function seedCustomerSyncErrors(
  prisma: PrismaClient,
  organizationId: string,
  srcDagId: string,
  generalErrorId: string
): Promise<void> {
  const env = "production";

  // Run 1: 6 hours ago - failed with db connection error
  const run1Start = hoursAgo(6);
  const run1EndTime = new Date(run1Start.getTime() + 2 * 60 * 1000);
  const dagRun1 = await prisma.dagRun.create({
    data: {
      organizationId,
      srcDagId,
      srcRunId: `scheduled__${run1Start.toISOString()}`,
      namespace: "airflow",
      environment: env,
      startTime: run1Start,
      endTime: run1EndTime,
      duration: 120,
      runType: "scheduled",
      status: DagRunStatus.FAILED,
    },
  });

  const task1Start = new Date(run1Start.getTime() + 1000);
  const taskRun1 = await prisma.taskRun.create({
    data: {
      organizationId,
      dagRunId: dagRun1.id,
      srcTaskId: "fetch_customers",
      environment: env,
      status: "failed",
      startTime: task1Start,
      endTime: new Date(task1Start.getTime() + 1 * 60 * 1000),
      duration: 60,
      operator: "PythonOperator",
      errorMessage: "could not connect to server: Connection refused",
    },
  });

  await prisma.errorOccurrence.create({
    data: {
      organizationId,
      generalErrorId,
      taskRunId: taskRun1.id,
      errorId: generateErrorId(),
      operator: "PythonOperator",
      tryNumber: 1,
      stacktrace: [
        {
          filename: "/usr/local/lib/python3.10/site-packages/airflow/models/taskinstance.py",
          function: "_run_raw_task",
          lineno: 1916,
          module: "airflow.models.taskinstance",
          source_context: [
            { lineno: 1914, code: "            self.task.execute(context=context)", current: false },
            { lineno: 1915, code: "        except Exception as e:", current: false },
            { lineno: 1916, code: "            self.handle_failure(e, test_mode, context)", current: true },
          ]
        },
        {
          filename: "/opt/airflow/dags/customer_sync.py",
          function: "fetch_customers",
          lineno: 45,
          module: "customer_sync",
          source_context: [
            { lineno: 43, code: "def fetch_customers():", current: false },
            { lineno: 44, code: "    logger.info('Fetching customers...')", current: false },
            { lineno: 45, code: "    conn = psycopg2.connect(host='postgres-primary.internal', port=5432)", current: true },
            { lineno: 46, code: "    # ... process data", current: false },
          ],
          locals: {
            host: "'postgres-primary.internal'",
            port: "5432",
            timeout: "30"
          }
        },
        {
          filename: "/usr/local/lib/python3.10/site-packages/psycopg2/__init__.py",
          function: "connect",
          lineno: 122,
          module: "psycopg2",
          source_context: [
            { lineno: 120, code: "    if dsn is None:", current: false },
            { lineno: 121, code: "        dsn = make_dsn(**kwargs)", current: false },
            { lineno: 122, code: "    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)", current: true },
            { lineno: 123, code: "    return conn", current: false },
          ]
        }
      ],
      timestamp: new Date(task1Start.getTime() + 30 * 1000),
    },
  });

  // Run 2: 3 hours ago - failed again
  const run2Start = hoursAgo(3);
  const run2EndTime = new Date(run2Start.getTime() + 2 * 60 * 1000);
  const dagRun2 = await prisma.dagRun.create({
    data: {
      organizationId,
      srcDagId,
      srcRunId: `scheduled__${run2Start.toISOString()}`,
      namespace: "airflow",
      environment: env,
      startTime: run2Start,
      endTime: run2EndTime,
      duration: 120,
      runType: "scheduled",
      status: DagRunStatus.FAILED,
    },
  });

  const task2Start = new Date(run2Start.getTime() + 1000);
  const taskRun2 = await prisma.taskRun.create({
    data: {
      organizationId,
      dagRunId: dagRun2.id,
      srcTaskId: "fetch_customers",
      environment: env,
      status: "failed",
      startTime: task2Start,
      endTime: new Date(task2Start.getTime() + 1 * 60 * 1000),
      duration: 60,
      operator: "PythonOperator",
      errorMessage: "could not connect to server: Connection refused",
    },
  });

  await prisma.errorOccurrence.create({
    data: {
      organizationId,
      generalErrorId,
      taskRunId: taskRun2.id,
      errorId: generateErrorId(),
      operator: "PythonOperator",
      tryNumber: 1,
      stacktrace: [
        {
          filename: "/usr/local/lib/python3.10/site-packages/airflow/models/taskinstance.py",
          function: "_run_raw_task",
          lineno: 1916,
          module: "airflow.models.taskinstance",
          source_context: [
            { lineno: 1914, code: "            self.task.execute(context=context)", current: false },
            { lineno: 1915, code: "        except Exception as e:", current: false },
            { lineno: 1916, code: "            self.handle_failure(e, test_mode, context)", current: true },
          ]
        },
        {
          filename: "/opt/airflow/dags/customer_sync.py",
          function: "fetch_customers",
          lineno: 45,
          module: "customer_sync",
          source_context: [
            { lineno: 43, code: "def fetch_customers():", current: false },
            { lineno: 44, code: "    logger.info('Fetching customers...')", current: false },
            { lineno: 45, code: "    conn = psycopg2.connect(host='postgres-primary.internal', port=5432)", current: true },
            { lineno: 46, code: "    # ... process data", current: false },
          ],
          locals: {
            host: "'postgres-primary.internal'",
            port: "5432",
            timeout: "30"
          }
        },
        {
          filename: "/usr/local/lib/python3.10/site-packages/psycopg2/__init__.py",
          function: "connect",
          lineno: 122,
          module: "psycopg2",
          source_context: [
            { lineno: 120, code: "    if dsn is None:", current: false },
            { lineno: 121, code: "        dsn = make_dsn(**kwargs)", current: false },
            { lineno: 122, code: "    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)", current: true },
            { lineno: 123, code: "    return conn", current: false },
          ]
        }
      ],
      timestamp: new Date(task2Start.getTime() + 30 * 1000),
    },
  });
}

async function seedOrderSyncErrors(
  prisma: PrismaClient,
  organizationId: string,
  srcDagId: string,
  generalErrorId: string
): Promise<void> {
  const env = "production";

  // Run 1: 5 hours ago - failed with SAME db connection error
  const run1Start = hoursAgo(5);
  const run1EndTime = new Date(run1Start.getTime() + 3 * 60 * 1000);
  const dagRun1 = await prisma.dagRun.create({
    data: {
      organizationId,
      srcDagId,
      srcRunId: `scheduled__${run1Start.toISOString()}`,
      namespace: "airflow",
      environment: env,
      startTime: run1Start,
      endTime: run1EndTime,
      duration: 180,
      runType: "scheduled",
      status: DagRunStatus.FAILED,
    },
  });

  const task1Start = new Date(run1Start.getTime() + 1000);
  const taskRun1 = await prisma.taskRun.create({
    data: {
      organizationId,
      dagRunId: dagRun1.id,
      srcTaskId: "fetch_orders",
      environment: env,
      status: "failed",
      startTime: task1Start,
      endTime: new Date(task1Start.getTime() + 2 * 60 * 1000),
      duration: 120,
      operator: "PythonOperator",
      errorMessage: "could not connect to server: Connection refused",
    },
  });

  await prisma.errorOccurrence.create({
    data: {
      organizationId,
      generalErrorId,
      taskRunId: taskRun1.id,
      errorId: generateErrorId(),
      operator: "PythonOperator",
      tryNumber: 1,
      stacktrace: [
        {
          filename: "/usr/local/lib/python3.10/site-packages/airflow/models/taskinstance.py",
          function: "_run_raw_task",
          lineno: 1916,
          module: "airflow.models.taskinstance",
          source_context: [
            { lineno: 1914, code: "            self.task.execute(context=context)", current: false },
            { lineno: 1915, code: "        except Exception as e:", current: false },
            { lineno: 1916, code: "            self.handle_failure(e, test_mode, context)", current: true },
          ]
        },
        {
          filename: "/opt/airflow/dags/order_sync.py",
          function: "fetch_orders",
          lineno: 78,
          module: "order_sync",
          source_context: [
            { lineno: 76, code: "def fetch_orders():", current: false },
            { lineno: 77, code: "    logger.info('Fetching orders...')", current: false },
            { lineno: 78, code: "    conn = psycopg2.connect(host='postgres-primary.internal', port=5432)", current: true },
            { lineno: 79, code: "    # ... process data", current: false },
          ],
          locals: {
            host: "'postgres-primary.internal'",
            port: "5432"
          }
        },
        {
          filename: "/usr/local/lib/python3.10/site-packages/psycopg2/__init__.py",
          function: "connect",
          lineno: 122,
          module: "psycopg2",
          source_context: [
            { lineno: 120, code: "    if dsn is None:", current: false },
            { lineno: 121, code: "        dsn = make_dsn(**kwargs)", current: false },
            { lineno: 122, code: "    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)", current: true },
            { lineno: 123, code: "    return conn", current: false },
          ]
        }
      ],
      timestamp: new Date(task1Start.getTime() + 90 * 1000),
    },
  });

  // Run 2: 1 hour ago - failed again
  const run2Start = hoursAgo(1);
  const run2EndTime = new Date(run2Start.getTime() + 3 * 60 * 1000);
  const dagRun2 = await prisma.dagRun.create({
    data: {
      organizationId,
      srcDagId,
      srcRunId: `scheduled__${run2Start.toISOString()}`,
      namespace: "airflow",
      environment: env,
      startTime: run2Start,
      endTime: run2EndTime,
      duration: 180,
      runType: "scheduled",
      status: DagRunStatus.FAILED,
    },
  });

  const task2Start = new Date(run2Start.getTime() + 1000);
  const taskRun2 = await prisma.taskRun.create({
    data: {
      organizationId,
      dagRunId: dagRun2.id,
      srcTaskId: "fetch_orders",
      environment: env,
      status: "failed",
      startTime: task2Start,
      endTime: new Date(task2Start.getTime() + 2 * 60 * 1000),
      duration: 120,
      operator: "PythonOperator",
      errorMessage: "could not connect to server: Connection refused",
    },
  });

  await prisma.errorOccurrence.create({
    data: {
      organizationId,
      generalErrorId,
      taskRunId: taskRun2.id,
      errorId: generateErrorId(),
      operator: "PythonOperator",
      tryNumber: 1,
      stacktrace: [
        {
          filename: "/usr/local/lib/python3.10/site-packages/airflow/models/taskinstance.py",
          function: "_run_raw_task",
          lineno: 1916,
          module: "airflow.models.taskinstance",
          source_context: [
            { lineno: 1914, code: "            self.task.execute(context=context)", current: false },
            { lineno: 1915, code: "        except Exception as e:", current: false },
            { lineno: 1916, code: "            self.handle_failure(e, test_mode, context)", current: true },
          ]
        },
        {
          filename: "/opt/airflow/dags/order_sync.py",
          function: "fetch_orders",
          lineno: 78,
          module: "order_sync",
          source_context: [
            { lineno: 76, code: "def fetch_orders():", current: false },
            { lineno: 77, code: "    logger.info('Fetching orders...')", current: false },
            { lineno: 78, code: "    conn = psycopg2.connect(host='postgres-primary.internal', port=5432)", current: true },
            { lineno: 79, code: "    # ... process data", current: false },
          ],
          locals: {
            host: "'postgres-primary.internal'",
            port: "5432"
          }
        },
        {
          filename: "/usr/local/lib/python3.10/site-packages/psycopg2/__init__.py",
          function: "connect",
          lineno: 122,
          module: "psycopg2",
          source_context: [
            { lineno: 120, code: "    if dsn is None:", current: false },
            { lineno: 121, code: "        dsn = make_dsn(**kwargs)", current: false },
            { lineno: 122, code: "    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)", current: true },
            { lineno: 123, code: "    return conn", current: false },
          ]
        }
      ],
      timestamp: new Date(task2Start.getTime() + 90 * 1000),
    },
  });
}
