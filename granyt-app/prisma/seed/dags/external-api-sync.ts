import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo, generateFingerprint, generateErrorId } from "../utils";

/**
 * DAG 10: External API Sync
 * Demonstrates flaky DAG with intermittent timeout failures
 */
export async function seedExternalApiSyncDAG(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  const dag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "external_api_sync",
      namespace: "airflow",
      description: "External API sync - experiences intermittent timeout failures",
      schedule: "*/30 * * * *",
    },
  });

  // Create GeneralError for timeout errors
  const timeoutErrorType = "requests.exceptions.ReadTimeout";
  const timeoutErrorMessage = "HTTPSConnectionPool(host='api.external-service.com', port=<NUM>): Read timed out. (read timeout=<NUM>)";
  const timeoutFingerprintContent = `${timeoutErrorType}:${timeoutErrorMessage.substring(0, 200)}`;
  const timeoutFingerprint = generateFingerprint(timeoutFingerprintContent);

  const timeoutError = await prisma.generalError.create({
    data: {
      organizationId,
      fingerprint: timeoutFingerprint,
      exceptionType: timeoutErrorType,
      message: "HTTPSConnectionPool(host='api.external-service.com', port=443): Read timed out. (read timeout=30)",
      status: "open",
      occurrenceCount: 3,
      firstSeenAt: hoursAgo(48),
      lastSeenAt: hoursAgo(2),
    },
  });

  // Pattern: mostly success, but intermittent failures (~87% success rate)
  const flakyRunPattern = [
    { offset: 48, status: "success" as const },
    { offset: 47.5, status: "failed" as const },
    { offset: 47, status: "success" as const },
    { offset: 46.5, status: "success" as const },
    { offset: 46, status: "success" as const },
    { offset: 45.5, status: "success" as const },
    { offset: 24, status: "success" as const },
    { offset: 23.5, status: "success" as const },
    { offset: 23, status: "failed" as const },
    { offset: 22.5, status: "success" as const },
    { offset: 12, status: "success" as const },
    { offset: 11.5, status: "success" as const },
    { offset: 6, status: "success" as const },
    { offset: 5.5, status: "success" as const },
    { offset: 5, status: "success" as const },
    { offset: 4.5, status: "success" as const },
    { offset: 4, status: "success" as const },
    { offset: 3.5, status: "success" as const },
    { offset: 3, status: "success" as const },
    { offset: 2.5, status: "success" as const },
    { offset: 2, status: "failed" as const },
    { offset: 1.5, status: "success" as const },
    { offset: 1, status: "success" as const },
    { offset: 0.5, status: "success" as const },
  ];

  const env = "production";

  for (const runData of flakyRunPattern) {
    const runStartTime = hoursAgo(runData.offset);
    const runId = `scheduled__${runStartTime.toISOString()}`;
    const endTime = new Date(runStartTime.getTime() + (runData.status === "failed" ? 35 : 4) * 60 * 1000);

    const dagRun = await prisma.dagRun.create({
      data: {
        organizationId,
        srcDagId: dag.srcDagId,
        srcRunId: runId,
        namespace: "airflow",
        environment: env,
        startTime: runStartTime,
        endTime,
        duration: runData.status === "failed" ? 2100 : 240,
        runType: "scheduled",
        status: runData.status === "success" ? DagRunStatus.SUCCESS : DagRunStatus.FAILED,
      },
    });

    const taskStart = new Date(runStartTime.getTime() + 1000);
    const taskRun = await prisma.taskRun.create({
      data: {
        organizationId,
        dagRunId: dagRun.id,
        srcTaskId: "sync_external_data",
        environment: env,
        status: runData.status,
        startTime: taskStart,
        endTime: new Date(taskStart.getTime() + (runData.status === "failed" ? 32 : 3) * 60 * 1000),
        duration: runData.status === "failed" ? 1920 : 180,
        operator: "PythonOperator",
        errorMessage: runData.status === "failed" ? "Read timed out" : null,
      },
    });

    if (runData.status === "success") {
      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "external_api_sync.sync_external_data",
          taskRunId: taskRun.id,
          metrics: {
            row_count: 2500 + Math.floor(Math.random() * 500),
            column_count: 6,
            memory_bytes: 2500 * 80,
            dataframe_type: "pandas",
            columns: [
              { name: "external_id", dtype: "object", null_count: 0, empty_string_count: 0 },
              { name: "data_type", dtype: "object", null_count: 0, empty_string_count: 0 },
              { name: "payload", dtype: "object", null_count: 0, empty_string_count: 0 },
              { name: "fetched_at", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
            ],
            upstream: null,
          },
          capturedAt: new Date(taskStart.getTime() + 2 * 60 * 1000),
        },
      });
    } else {
      await prisma.errorOccurrence.create({
        data: {
          organizationId,
          generalErrorId: timeoutError.id,
          taskRunId: taskRun.id,
          errorId: generateErrorId(),
          operator: "PythonOperator",
          tryNumber: 3,
          stacktrace: [
            {
              filename: "/usr/local/lib/python3.10/site-packages/requests/sessions.py",
              function: "send",
              lineno: 703,
              module: "requests.sessions",
              source_context: [
                { lineno: 701, code: "        # Send the request", current: false },
                { lineno: 702, code: "        try:", current: false },
                { lineno: 703, code: "            r = adapter.send(request, **kwargs)", current: true },
              ]
            },
            {
              filename: "/opt/airflow/dags/external_api_sync.py",
              function: "sync_external_data",
              lineno: 56,
              module: "external_api_sync",
              source_context: [
                { lineno: 54, code: "def sync_external_data(url):", current: false },
                { lineno: 55, code: "    logger.info(f'Syncing from {url}')", current: false },
                { lineno: 56, code: "    response = requests.get(url, timeout=30)", current: true },
                { lineno: 57, code: "    return response.json()", current: false },
              ],
              locals: {
                url: "'https://api.external-service.com/v1/data'",
                timeout: "30"
              }
            },
            {
              filename: "/usr/local/lib/python3.10/site-packages/requests/adapters.py",
              function: "send",
              lineno: 532,
              module: "requests.adapters",
              source_context: [
                { lineno: 530, code: "        except _ReadTimeoutError as e:", current: false },
                { lineno: 531, code: "            if isinstance(e, _ReadTimeoutError):", current: false },
                { lineno: 532, code: "                raise ReadTimeout(e, request=request)", current: true },
              ]
            }
          ],
          timestamp: new Date(taskStart.getTime() + 31 * 60 * 1000),
        },
      });
    }
  }

  console.log("✅ Created DAG 10 (external_api_sync) - flaky DAG:");
  console.log("   - Runs every 30 minutes");
  console.log("   - ~87% success rate with intermittent timeout failures");
  console.log("   - 3 timeout errors over 48 hours");
}
