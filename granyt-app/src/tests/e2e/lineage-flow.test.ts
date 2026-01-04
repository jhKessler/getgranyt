import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupE2ETestData, cleanupE2ETestData } from "./helpers";
import { ingestLineage } from "@/server/services/ingest";
import { dashboardRouter } from "@/server/routers/dashboard";
import { RunStatus } from "@/lib/status-colors";
import { prisma } from "@/lib/prisma";

describe("E2E: Lineage Flow", () => {
  let testData: Awaited<ReturnType<typeof setupE2ETestData>>;

  beforeAll(async () => {
    testData = await setupE2ETestData();
  });

  afterAll(async () => {
    await cleanupE2ETestData(testData.org.id, testData.user.id);
  });

  it("should track a full DAG run from START to COMPLETE", async () => {
    const { org, ctx } = testData;
    const caller = dashboardRouter.createCaller(ctx as any);

    const dagId = "e2e_lineage_dag";
    const dagRunId = `e2e_run_${Date.now()}`;
    const taskRunId = "550e8400-e29b-41d4-a716-446655440000";
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 5000); // 5 seconds later

    // 1. Ingest DAG START
    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "START",
        eventTime: startTime.toISOString(),
        run: { runId: dagRunId },
        job: { name: dagId, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    // Verify DAG is running
    let dags = await caller.getDagsOverview({ environment: "production" });
    let testDag = dags.find(d => d.dagId === dagId);
    expect(testDag).toBeDefined();
    expect(testDag?.lastStatus).toBe("running");

    // 2. Ingest Task START
    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "START",
        eventTime: startTime.toISOString(),
        run: { 
          runId: taskRunId,
          facets: {
            parent: {
              run: { runId: dagRunId }
            }
          }
        },
        job: { name: `${dagId}.task_1`, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    // 3. Ingest Task COMPLETE
    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "COMPLETE",
        eventTime: endTime.toISOString(),
        run: { 
          runId: taskRunId,
          facets: {
            parent: {
              run: { runId: dagRunId }
            }
          }
        },
        job: { name: `${dagId}.task_1`, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    // 4. Ingest DAG COMPLETE
    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "COMPLETE",
        eventTime: endTime.toISOString(),
        run: { runId: dagRunId },
        job: { name: dagId, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    // 5. Verify DAG is Success
    dags = await caller.getDagsOverview({ environment: "production" });
    testDag = dags.find(d => d.dagId === dagId);
    expect(testDag?.lastStatus).toBe("success");

    // 6. Check Run Details
    const run = await prisma.dagRun.findFirst({
      where: { srcRunId: dagRunId, organizationId: org.id },
    });
    expect(run).toBeDefined();

    const runDetails = await caller.getRunDetails({
      runId: run!.id,
    });

    expect(runDetails).toBeDefined();
    expect(runDetails?.status).toBe(RunStatus.Success);
    expect(runDetails?.tasks.length).toBe(1);
    expect(runDetails?.tasks[0].srcTaskId).toBe("task_1");
    expect(runDetails?.tasks[0].status).toBe("success");
  });
});
