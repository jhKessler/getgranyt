import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchHistoricalRuns } from "./historical-data";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    metric: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("fetchHistoricalRuns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockMetric = (
    rowCount: number,
    environment: string | null,
    daysAgo: number = 1
  ) => ({
    metrics: { row_count: rowCount },
    capturedAt: new Date(Date.now() - daysAgo * 86400000),
    taskRun: {
      dagRun: {
        runType: "scheduled",
        startTime: new Date(Date.now() - daysAgo * 86400000),
        environment,
      },
    },
  });

  describe("environment filtering", () => {
    it("should only return runs from the specified environment", async () => {
      const mockData = [
        createMockMetric(1000, "production", 1),
        createMockMetric(2000, "development", 2),
        createMockMetric(1500, "production", 3),
        createMockMetric(3000, "staging", 4),
        createMockMetric(1200, "production", 5),
      ];

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      const result = await fetchHistoricalRuns("org-1", "capture-1", "production");

      // Verify the query included environment filter
      expect(prisma.metric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: "org-1",
            captureId: "capture-1",
            taskRun: {
              dagRun: {
                environment: "production",
              },
            },
          }),
        })
      );
    });

    it("should not apply environment filter when environment is null", async () => {
      const mockData = [
        createMockMetric(1000, "production", 1),
        createMockMetric(2000, "development", 2),
      ];

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      const result = await fetchHistoricalRuns("org-1", "capture-1", null);

      // Verify the query did NOT include environment filter
      expect(prisma.metric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: "org-1",
            captureId: "capture-1",
          },
        })
      );
    });

    it("should return empty array when no runs match the environment", async () => {
      vi.mocked(prisma.metric.findMany).mockResolvedValue([]);

      const result = await fetchHistoricalRuns("org-1", "capture-1", "production");

      expect(result).toEqual([]);
    });

    it("should correctly enrich data with temporal fields", async () => {
      const now = new Date();
      const mockData = [
        {
          metrics: { row_count: 1000 },
          capturedAt: now,
          taskRun: {
            dagRun: {
              runType: "scheduled",
              startTime: now,
              environment: "production",
            },
          },
        },
      ];

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      const result = await fetchHistoricalRuns("org-1", "capture-1", "production");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        rowCount: 1000,
        capturedAt: now,
        runType: "scheduled",
        dayOfWeek: now.getUTCDay(),
        hourOfDay: now.getUTCHours(),
      });
    });
  });
});
