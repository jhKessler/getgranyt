import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupE2ETestData, cleanupE2ETestData } from "./helpers";
import { ingestMetrics, ingestLineage } from "@/server/services/ingest";
import { dashboardRouter } from "@/server/routers/dashboard";
import prisma from "@/lib/prisma";

describe("E2E: Metrics", () => {
  let testData: Awaited<ReturnType<typeof setupE2ETestData>>;

  beforeAll(async () => {
    testData = await setupE2ETestData();
  });

  afterAll(async () => {
    await cleanupE2ETestData(testData.org.id, testData.user.id);
  });

  it("should ingest metrics and display them in the dashboard", async () => {
    const { org, ctx } = testData;
    const caller = dashboardRouter.createCaller(ctx as any);

    const dagId = "e2e_metrics_dag";
    const runId = `e2e_run_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 1. First create the run via lineage so metrics have a run to attach to
    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "START",
        eventTime: timestamp,
        run: { runId },
        job: { name: dagId, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    // 2. Ingest metrics (now using unified metrics format)
    await ingestMetrics({
      organizationId: org.id,
      environment: "production",
      payload: {
        captured_at: timestamp,
        dag_id: dagId,
        task_id: "e2e_metrics_task",
        run_id: runId,
        metrics: {
          row_count: 1500,
          column_count: 5,
          dataframe_type: "pandas",
        },
        schema: {
          column_dtypes: {
            id: "int64",
            email: "object",
            name: "object",
            created_at: "datetime64[ns]",
            updated_at: "datetime64[ns]",
          },
          null_counts: {
            id: 0,
            email: 5,
            name: 0,
            created_at: 0,
            updated_at: 0,
          },
          empty_string_counts: {
            id: 0,
            email: 0,
            name: 0,
          },
        },
      }
    });

    // 3. Verify metrics in timeline
    const timelines = await caller.getMetricsTimeline({
      dagId,
      environment: "production",
    });

    expect(timelines.length).toBeGreaterThan(0);
    const testTimeline = timelines.find(t => t.taskId === "e2e_metrics_task");
    expect(testTimeline).toBeDefined();
    // Metrics are now stored as flexible JSON, access via .metrics object
    expect(testTimeline?.dataPoints[0].metrics.row_count).toBe(1500);

    // 4. Verify metrics for specific run
    const dagRun = await prisma.dagRun.findUnique({
      where: {
        organizationId_srcDagId_srcRunId_environment: {
          organizationId: org.id,
          srcDagId: dagId,
          srcRunId: runId,
          environment: "production",
        }
      }
    });

    const runMetrics = await caller.getRunMetrics({
      runId: dagRun!.id,
    });

    expect(runMetrics).toBeDefined();
    expect(runMetrics?.captures.length).toBe(1);
    // Access row_count from the metrics object
    expect(runMetrics?.captures[0].metrics.row_count).toBe(1500);
  });
});
