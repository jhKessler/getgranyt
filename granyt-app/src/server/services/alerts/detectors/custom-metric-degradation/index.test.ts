import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectCustomMetricDegradation } from "./index";
import type { CustomMetricMonitor } from "@prisma/client";
import { AlertSensitivity } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    metric: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Custom Metric Degradation Detector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMonitor = (overrides: Partial<CustomMetricMonitor> = {}): CustomMetricMonitor => ({
    id: "monitor-1",
    organizationId: "org-1",
    srcDagId: "test_dag",
    metricName: "custom_ratio",
    monitorType: "DEGRADATION",
    sensitivity: AlertSensitivity.MEDIUM,
    customThreshold: null,
    windowDays: 7,
    minDeclinePercent: 10,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockMetric = (value: number, daysAgo: number = 1) => ({
    metrics: { custom_ratio: value },
    capturedAt: new Date(Date.now() - daysAgo * 86400000),
  });

  describe("environment filtering", () => {
    it("should only compare metrics from the same environment", async () => {
      // Create a declining trend
      const mockData = Array(10)
        .fill(null)
        .map((_, i) => createMockMetric(100 - i * 5, i + 1));

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      await detectCustomMetricDegradation(
        "org-1",
        "test_dag",
        "custom_ratio",
        50,
        createMonitor(),
        "production"
      );

      // Verify the query included environment filter
      expect(prisma.metric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: "org-1",
            taskRun: {
              dagRun: {
                srcDagId: "test_dag",
                environment: "production",
              },
            },
          }),
        })
      );
    });

    it("should not apply environment filter when environment is null", async () => {
      const mockData = Array(10)
        .fill(null)
        .map((_, i) => createMockMetric(100 - i * 5, i + 1));

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      await detectCustomMetricDegradation(
        "org-1",
        "test_dag",
        "custom_ratio",
        50,
        createMonitor(),
        null
      );

      // Verify the query did NOT include environment filter
      expect(prisma.metric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: "org-1",
            taskRun: {
              dagRun: {
                srcDagId: "test_dag",
              },
            },
          }),
        })
      );
    });

    it("should return null when no history exists for the environment", async () => {
      vi.mocked(prisma.metric.findMany).mockResolvedValue([]);

      const result = await detectCustomMetricDegradation(
        "org-1",
        "test_dag",
        "custom_ratio",
        50,
        createMonitor(),
        "production"
      );

      expect(result).toBeNull();
    });
  });

  describe("basic detection", () => {
    it("should detect degradation when there is a sustained decline", async () => {
      // Create a clear declining trend: 100 -> 50 over time
      const mockData = [
        createMockMetric(55, 1),
        createMockMetric(60, 2),
        createMockMetric(70, 3),
        createMockMetric(80, 4),
        createMockMetric(90, 5),
        createMockMetric(100, 6),
      ];

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      const result = await detectCustomMetricDegradation(
        "org-1",
        "test_dag",
        "custom_ratio",
        50, // Current value showing continued decline
        createMonitor({ minDeclinePercent: 10 }),
        "production"
      );

      expect(result).not.toBeNull();
      expect(result?.shouldAlert).toBe(true);
    });

    it("should not alert when there is no decline", async () => {
      // Stable values
      const mockData = Array(10)
        .fill(null)
        .map((_, i) => createMockMetric(100, i + 1));

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      const result = await detectCustomMetricDegradation(
        "org-1",
        "test_dag",
        "custom_ratio",
        100,
        createMonitor(),
        "production"
      );

      expect(result).toBeNull();
    });

    it("should return null when not enough data points", async () => {
      const mockData = [createMockMetric(100, 1), createMockMetric(90, 2)];

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      const result = await detectCustomMetricDegradation(
        "org-1",
        "test_dag",
        "custom_ratio",
        80,
        createMonitor(),
        "production"
      );

      expect(result).toBeNull();
    });
  });
});
