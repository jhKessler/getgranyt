import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupE2ETestData, cleanupE2ETestData } from "./helpers";
import { ingestMetrics, ingestLineage } from "@/server/services/ingest";
import { processAlertEvaluation } from "@/server/services/alerts";
import prisma from "@/lib/prisma";
import { AlertType, AlertStatus } from "@prisma/client";

describe("E2E: Alert Detection (New Schema Format)", () => {
  let testData: Awaited<ReturnType<typeof setupE2ETestData>>;

  beforeAll(async () => {
    testData = await setupE2ETestData();
  });

  afterAll(async () => {
    await cleanupE2ETestData(testData.org.id, testData.user.id);
  });

  it("should trigger NULL_OCCURRENCE alert using the new schema column", async () => {
    const { org } = testData;
    const dagId = "e2e_null_alert_dag";
    
    // 1. Ingest 5 historical runs with NO nulls
    for (let i = 0; i < 5; i++) {
      const runId = `hist_run_${i}_${Date.now()}`;
      const timestamp = new Date(Date.now() - (10 - i) * 3600000).toISOString();

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

      await ingestMetrics({
        organizationId: org.id,
        environment: "production",
        payload: {
          captured_at: timestamp,
          dag_id: dagId,
          task_id: "task_1",
          run_id: runId,
          metrics: { row_count: 100 },
          schema: {
            column_dtypes: { val: "int64" },
            null_counts: { val: 0 },
          },
        }
      });

      await ingestLineage({
        organizationId: org.id,
        environment: "production",
        event: {
          eventType: "COMPLETE",
          eventTime: timestamp,
          run: { runId },
          job: { name: dagId, namespace: "airflow" },
          inputs: [],
          outputs: [],
          producer: "test-producer",
          schemaURL: "test-schema",
        },
      });
    }

    // 2. Ingest a new run WITH nulls
    const currentRunId = `current_run_${Date.now()}`;
    const currentTimestamp = new Date().toISOString();

    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "START",
        eventTime: currentTimestamp,
        run: { runId: currentRunId },
        job: { name: dagId, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    await ingestMetrics({
      organizationId: org.id,
      environment: "production",
      payload: {
        captured_at: currentTimestamp,
        dag_id: dagId,
        task_id: "task_1",
        run_id: currentRunId,
        metrics: { row_count: 100 },
        schema: {
          column_dtypes: { val: "int64" },
          null_counts: { val: 10 }, // NEW NULLS!
        },
      }
    });

    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "COMPLETE",
        eventTime: currentTimestamp,
        run: { runId: currentRunId },
        job: { name: dagId, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    // 3. Manually trigger alert evaluation for this run
    const dagRun = await prisma.dagRun.findFirst({ where: { srcRunId: currentRunId } });
    const job = await prisma.alertEvaluationJob.findUnique({
      where: { dagRunId: dagRun?.id }
    });

    expect(job).toBeDefined();
    if (job) {
      // Force it to be due now so processAlertEvaluation doesn't skip it
      await prisma.alertEvaluationJob.update({
        where: { id: job.id },
        data: { scheduledFor: new Date(Date.now() - 1000) }
      });
      await processAlertEvaluation(job.id);
    }

    // 4. Verify alert was created
    const alerts = await prisma.alert.findMany({
      where: {
        organizationId: org.id,
        alertType: AlertType.NULL_OCCURRENCE,
      },
    });

    expect(alerts.length).toBeGreaterThan(0);
    const nullAlert = alerts.find(a => (a.metadata as any).affectedColumns?.some((c: any) => c.name === "val"));
    expect(nullAlert).toBeDefined();
    expect(nullAlert?.status).toBe(AlertStatus.OPEN);
  });

  it("should trigger SCHEMA_CHANGE alert using the new schema column", async () => {
    const { org } = testData;
    const dagId = "e2e_schema_alert_dag";
    
    // 1. Ingest a previous run
    const prevRunId = `prev_run_${Date.now()}`;
    const prevTimestamp = new Date(Date.now() - 3600000).toISOString();

    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "START",
        eventTime: prevTimestamp,
        run: { runId: prevRunId },
        job: { name: dagId, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    await ingestMetrics({
      organizationId: org.id,
      environment: "production",
      payload: {
        captured_at: prevTimestamp,
        dag_id: dagId,
        task_id: "task_1",
        run_id: prevRunId,
        metrics: { row_count: 100 },
        schema: {
          column_dtypes: { col1: "int64" },
        },
      }
    });

    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "COMPLETE",
        eventTime: prevTimestamp,
        run: { runId: prevRunId },
        job: { name: dagId, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    // 2. Ingest a new run with CHANGED schema
    const currentRunId = `schema_change_run_${Date.now()}`;
    const currentTimestamp = new Date().toISOString();

    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "START",
        eventTime: currentTimestamp,
        run: { runId: currentRunId },
        job: { name: dagId, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    await ingestMetrics({
      organizationId: org.id,
      environment: "production",
      payload: {
        captured_at: currentTimestamp,
        dag_id: dagId,
        task_id: "task_1",
        run_id: currentRunId,
        metrics: { row_count: 100 },
        schema: {
          column_dtypes: { col1: "float64" }, // TYPE CHANGE!
        },
      }
    });

    await ingestLineage({
      organizationId: org.id,
      environment: "production",
      event: {
        eventType: "COMPLETE",
        eventTime: currentTimestamp,
        run: { runId: currentRunId },
        job: { name: dagId, namespace: "airflow" },
        inputs: [],
        outputs: [],
        producer: "test-producer",
        schemaURL: "test-schema",
      },
    });

    // 3. Manually trigger alert evaluation
    const dagRun = await prisma.dagRun.findFirst({ where: { srcRunId: currentRunId } });
    const job = await prisma.alertEvaluationJob.findUnique({
      where: { dagRunId: dagRun?.id }
    });

    expect(job).toBeDefined();
    if (job) {
      // Force it to be due now
      await prisma.alertEvaluationJob.update({
        where: { id: job.id },
        data: { scheduledFor: new Date(Date.now() - 1000) }
      });
      await processAlertEvaluation(job.id);
    }

    // 4. Verify alert was created
    const alerts = await prisma.alert.findMany({
      where: {
        organizationId: org.id,
        alertType: AlertType.SCHEMA_CHANGE,
      },
    });

    expect(alerts.length).toBeGreaterThan(0);
    const schemaAlert = alerts.find(a => (a.metadata as any).summary.typeChangedCount === 1);
    expect(schemaAlert).toBeDefined();
  });
});
