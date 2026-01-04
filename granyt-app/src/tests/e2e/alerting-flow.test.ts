import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupE2ETestData, cleanupE2ETestData } from "./helpers";
import { alertsRouter } from "@/server/routers/alerts";
import { prisma } from "@/lib/prisma";
import { AlertType, AlertStatus, AlertSeverity } from "@prisma/client";

describe("E2E: Alerting Flow", () => {
  let testData: Awaited<ReturnType<typeof setupE2ETestData>>;

  beforeAll(async () => {
    testData = await setupE2ETestData();
  });

  afterAll(async () => {
    await cleanupE2ETestData(testData.org.id, testData.user.id);
  });

  it("should display alerts in the API and allow status updates", async () => {
    const { org, ctx } = testData;
    const caller = alertsRouter.createCaller(ctx as any);

    // 1. Manually create an alert in the DB (simulating a detector finding an issue)
    // We need a DAG and a DAG Run first
    const dag = await prisma.dag.create({
      data: {
        id: "e2e_alert_dag",
        srcDagId: "e2e_alert_dag",
        organizationId: org.id,
        namespace: "airflow",
      }
    });

    const dagRun = await prisma.dagRun.create({
      data: {
        organizationId: org.id,
        srcDagId: "e2e_alert_dag",
        srcRunId: "e2e_alert_run_1",
        status: "FAILED",
        startTime: new Date(),
        environment: "production",
      }
    });

    const alert = await prisma.alert.create({
      data: {
        organizationId: org.id,
        alertType: AlertType.ROW_COUNT_DROP,
        status: AlertStatus.OPEN,
        severity: "critical",
        srcDagId: dag.id,
        dagRunId: dagRun.id,
        metadata: { drop_percentage: 50 },
      }
    });

    // 2. Check if it appears in the alerts list
    const alerts = await caller.getAlerts({
      status: AlertStatus.OPEN,
    });

    expect(alerts.length).toBeGreaterThan(0);
    const foundAlert = alerts.find(a => a.id === alert.id);
    expect(foundAlert).toBeDefined();
    expect(foundAlert?.alertType).toBe(AlertType.ROW_COUNT_DROP);

    // 3. Dismiss the alert
    await caller.dismiss({
      alertId: alert.id,
    });

    // 4. Verify it's no longer in OPEN alerts
    const openAlerts = await caller.getAlerts({
      status: "OPEN",
    });
    expect(openAlerts.find(a => a.id === alert.id)).toBeUndefined();

    // 5. Verify it's in DISMISSED alerts
    const dismissedAlerts = await caller.getAlerts({
      status: "DISMISSED",
    });
    expect(dismissedAlerts.find(a => a.id === alert.id)).toBeDefined();
  });
});
