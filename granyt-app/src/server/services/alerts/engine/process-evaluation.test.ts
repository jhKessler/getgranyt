import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    alertEvaluationJob: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    dagRun: {
      findUnique: vi.fn(),
    },
    metric: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    organizationAlertSettings: {
      findUnique: vi.fn(),
    },
    dagAlertSettings: {
      findUnique: vi.fn(),
    },
    alert: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Process Alert Evaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should return empty array when job not found", async () => {
    vi.mocked(prisma.alertEvaluationJob.findUnique).mockResolvedValue(null);

    const { processAlertEvaluation } = await import("./process-evaluation");
    const result = await processAlertEvaluation("job-1");

    expect(result).toEqual([]);
  });

  it("should skip processing when job is not pending", async () => {
    vi.mocked(prisma.alertEvaluationJob.findUnique).mockResolvedValue({
      id: "job-1",
      organizationId: "org-1",
      dagRunId: "run-1",
      status: "completed", // Already processed
      scheduledFor: new Date(),
      attempts: 1,
      processedAt: new Date(),
      lastError: null,
      createdAt: new Date(),
    });

    const { processAlertEvaluation } = await import("./process-evaluation");
    const result = await processAlertEvaluation("job-1");

    expect(result).toEqual([]);
    expect(prisma.alertEvaluationJob.update).not.toHaveBeenCalled();
  });

  it("should update job status to processing when starting", async () => {
    vi.mocked(prisma.alertEvaluationJob.findUnique).mockResolvedValue({
      id: "job-1",
      organizationId: "org-1",
      dagRunId: "run-1",
      status: "pending",
      scheduledFor: new Date(Date.now() - 1000), // In the past
      attempts: 0,
      processedAt: null,
      lastError: null,
      createdAt: new Date(),
    });

    vi.mocked(prisma.alertEvaluationJob.update).mockResolvedValue({} as never);

    vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({
      id: "run-1",
      srcDagId: "test_dag",
      srcRunId: "airflow_run_1",
      organizationId: "org-1",
      status: "success",
      environment: "production",
      startTime: new Date(),
      endTime: new Date(),
      duration: 300,
      taskRuns: [
        {
          id: "task-1",
          srcTaskId: "task_1",
          dataMetrics: [
            {
              captureId: "capture-1",
              rowCount: 100,
              columns: [],
            },
          ],
        },
      ],
      dagId: "dag-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    // Mock alert settings and data for detectors
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.metric.findMany).mockResolvedValue([]);
    vi.mocked(prisma.metric.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.alert.findFirst).mockResolvedValue(null);

    const { processAlertEvaluation } = await import("./process-evaluation");
    await processAlertEvaluation("job-1");

    // Should have been called to update status to processing first
    expect(prisma.alertEvaluationJob.update).toHaveBeenCalled();
  });
});
