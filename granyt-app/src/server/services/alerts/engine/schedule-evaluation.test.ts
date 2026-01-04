import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    alertEvaluationJob: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Schedule Alert Evaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should create a pending job on schedule", async () => {
    vi.mocked(prisma.alertEvaluationJob.upsert).mockResolvedValue({
      id: "job-1",
      organizationId: "org-1",
      dagRunId: "run-1",
      status: "pending",
      scheduledFor: new Date(Date.now() + 60000),
      attempts: 0,
      processedAt: null,
      lastError: null,
      createdAt: new Date(),
    });

    // Import after mocks are set up
    const { scheduleAlertEvaluation } = await import("./schedule-evaluation");
    
    await scheduleAlertEvaluation("org-1", "run-1", 1000);

    expect(prisma.alertEvaluationJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { dagRunId: "run-1" },
        create: expect.objectContaining({
          organizationId: "org-1",
          dagRunId: "run-1",
          status: "pending",
        }),
      })
    );
  });
});
