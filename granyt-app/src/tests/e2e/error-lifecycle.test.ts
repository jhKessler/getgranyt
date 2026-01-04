import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupE2ETestData, cleanupE2ETestData } from "./helpers";
import { ingestError } from "@/server/services/ingest";
import { dashboardRouter } from "@/server/routers/dashboard";
import { prisma } from "@/lib/prisma";
import { ErrorStatus } from "@/server/services/dashboard/types";

describe("E2E: Error Lifecycle", () => {
  let testData: Awaited<ReturnType<typeof setupE2ETestData>>;

  beforeAll(async () => {
    testData = await setupE2ETestData();
  });

  afterAll(async () => {
    await cleanupE2ETestData(testData.org.id, testData.user.id);
  });

  it("should ingest an error and propagate it to the dashboard API", async () => {
    const { org, ctx } = testData;
    const caller = dashboardRouter.createCaller(ctx as any);

    const errorId = "e2e-error-123";
    const errorMessage = "E2E Test Error: Something went wrong";
    
    // 1. Ingest the error
    await ingestError({
      organizationId: org.id,
      environment: "production",
      event: {
        error_id: errorId,
        timestamp: new Date().toISOString(),
        exception: {
          type: "RuntimeError",
          message: errorMessage,
        },
        stacktrace: [
          {
            filename: "test.py",
            function: "<module>",
            lineno: 10,
            module: "main",
          }
        ],
        task_instance: {
          dag_id: "e2e_test_dag",
          task_id: "e2e_test_task",
          run_id: "e2e_test_run_1",
        },
      },
    });

    // 2. Check if it appears in recent errors
    const recentErrors = await caller.getRecentErrors({
      limit: 10,
      environment: "production",
    });

    expect(recentErrors.length).toBeGreaterThan(0);
    const foundError = recentErrors.find(e => e.message === errorMessage);
    expect(foundError).toBeDefined();
    expect(foundError?.status).toBe(ErrorStatus.Open);

    // 3. Get error details
    const errorDetails = await caller.getErrorDetails({
      errorId: foundError!.id,
    });

    expect(errorDetails).toBeDefined();
    expect(errorDetails?.exceptionType).toBe("RuntimeError");
    expect(errorDetails?.occurrences.length).toBe(1);

    // 4. Update error status
    await caller.updateErrorStatus({
      errorId: foundError!.id,
      status: ErrorStatus.Resolved,
    });

    // 5. Verify status update
    const updatedErrorDetails = await caller.getErrorDetails({
      errorId: foundError!.id,
    });
    expect(updatedErrorDetails?.status).toBe(ErrorStatus.Resolved);
  });
});
