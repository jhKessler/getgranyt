import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupE2ETestData, cleanupE2ETestData } from "./helpers";
import { ingestError } from "@/server/services/ingest";
import { dashboardRouter } from "@/server/routers/dashboard";

describe("E2E: Multi-tenancy", () => {
  let orgA: Awaited<ReturnType<typeof setupE2ETestData>>;
  let orgB: Awaited<ReturnType<typeof setupE2ETestData>>;

  beforeAll(async () => {
    orgA = await setupE2ETestData();
    orgB = await setupE2ETestData();
  });

  afterAll(async () => {
    await cleanupE2ETestData(orgA.org.id, orgA.user.id);
    await cleanupE2ETestData(orgB.org.id, orgB.user.id);
  });

  it("should isolate data between organizations", async () => {
    const callerA = dashboardRouter.createCaller(orgA.ctx as any);
    const callerB = dashboardRouter.createCaller(orgB.ctx as any);

    // 1. Ingest error for Org A
    await ingestError({
      organizationId: orgA.org.id,
      environment: "production",
      event: {
        error_id: "550e8400-e29b-41d4-a716-446655440001",
        timestamp: new Date().toISOString(),
        exception: { type: "ErrorA", message: "Message A" },
        task_instance: { dag_id: "dag_a", task_id: "task_a", run_id: "run_a" },
      },
    });

    // 2. Ingest error for Org B
    await ingestError({
      organizationId: orgB.org.id,
      environment: "production",
      event: {
        error_id: "550e8400-e29b-41d4-a716-446655440002",
        timestamp: new Date().toISOString(),
        exception: { type: "ErrorB", message: "Message B" },
        task_instance: { dag_id: "dag_b", task_id: "task_b", run_id: "run_b" },
      },
    });

    // 3. Check Org A's view
    const errorsA = await callerA.getRecentErrors({ limit: 10 });
    expect(errorsA.some(e => e.message === "Message A")).toBe(true);
    expect(errorsA.some(e => e.message === "Message B")).toBe(false);

    // 4. Check Org B's view
    const errorsB = await callerB.getRecentErrors({ limit: 10 });
    expect(errorsB.some(e => e.message === "Message B")).toBe(true);
    expect(errorsB.some(e => e.message === "Message A")).toBe(false);
  });
});
