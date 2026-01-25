import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertSensitivity } from "@prisma/client";
import { detectCustomMetricDrop } from "./index";
import type { CustomMetricMonitor } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    metric: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Custom Metric Drop Detector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMonitor = (overrides: Partial<CustomMetricMonitor> = {}): CustomMetricMonitor => ({
    id: "monitor-1",
    organizationId: "org-1",
    srcDagId: "test_dag",
    metricName: "custom_count",
    monitorType: "DROP",
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
    metrics: { custom_count: value },
    capturedAt: new Date(Date.now() - daysAgo * 86400000),
  });

  describe("environment filtering", () => {
    it("should only compare metrics from the same environment", async () => {
      const mockData = Array(10)
        .fill(null)
        .map((_, i) => createMockMetric(1000, i + 1));

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      await detectCustomMetricDrop(
        "org-1",
        "test_dag",
        "custom_count",
        500,
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
        .map((_, i) => createMockMetric(1000, i + 1));

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      await detectCustomMetricDrop(
        "org-1",
        "test_dag",
        "custom_count",
        500,
        createMonitor(),
        null
      );

      // Verify the query did NOT include environment filter
      expect(prisma.metric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: "org-1",
            taskRun: {
              dagRun: {
                srcDagId: "test_dag",
              },
            },
          },
        })
      );
    });

    it("should return null when no history exists for the environment", async () => {
      vi.mocked(prisma.metric.findMany).mockResolvedValue([]);

      const result = await detectCustomMetricDrop(
        "org-1",
        "test_dag",
        "custom_count",
        500,
        createMonitor(),
        "production"
      );

      expect(result).toBeNull();
    });
  });

  describe("basic detection", () => {
    it("should detect drop when current value is significantly below baseline", async () => {
      const mockData = Array(10)
        .fill(null)
        .map((_, i) => createMockMetric(1000, i + 1));

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      const result = await detectCustomMetricDrop(
        "org-1",
        "test_dag",
        "custom_count",
        10, // 99% drop
        createMonitor(),
        "production"
      );

      expect(result).not.toBeNull();
      expect(result?.shouldAlert).toBe(true);
    });

    it("should not alert when drop is within acceptable range", async () => {
      const mockData = Array(10)
        .fill(null)
        .map((_, i) => createMockMetric(1000, i + 1));

      vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);

      const result = await detectCustomMetricDrop(
        "org-1",
        "test_dag",
        "custom_count",
        900, // Only 10% drop
        createMonitor(),
        "production"
      );

      expect(result).toBeNull();
    });

    it("should return null when disabled", async () => {
      const result = await detectCustomMetricDrop(
        "org-1",
        "test_dag",
        "custom_count",
        0,
        createMonitor({ sensitivity: AlertSensitivity.DISABLED }),
        "production"
      );

      expect(result).toBeNull();
    });
  });
});
