import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAvailableMetrics } from "./available-metrics.service";
import { BUILTIN_METRICS } from "./types";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    metric: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Available Metrics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAvailableMetrics", () => {
    it("should return all builtin metrics", async () => {
      vi.mocked(prisma.metric.findMany).mockResolvedValue([]);

      const result = await getAvailableMetrics({
        organizationId: "org-123",
        dagId: "my_dag",
      });

      expect(result.builtinMetrics).toEqual(BUILTIN_METRICS);
    });

    it("should extract unique custom metric names from data metrics", async () => {
      vi.mocked(prisma.metric.findMany).mockResolvedValue([
        { metrics: { processing_time: 10, memory_usage: 500 }, taskRun: { srcTaskId: "task1" } },
        { metrics: { processing_time: 15, cpu_usage: 80 }, taskRun: { srcTaskId: "task1" } },
        { metrics: null, taskRun: { srcTaskId: "task1" } },
      ] as any);

      const result = await getAvailableMetrics({
        organizationId: "org-123",
        dagId: "my_dag",
      });

      expect(result.customMetrics).toContain("processing_time");
      expect(result.customMetrics).toContain("memory_usage");
      expect(result.customMetrics).toContain("cpu_usage");
      expect(result.customMetrics).toHaveLength(3);
    });

    it("should return empty arrays when no custom metrics exist", async () => {
      vi.mocked(prisma.metric.findMany).mockResolvedValue([
        { metrics: null, taskRun: { srcTaskId: "task1" } },
      ] as any);

      const result = await getAvailableMetrics({
        organizationId: "org-123",
        dagId: "my_dag",
      });

      expect(result.customMetrics).toEqual([]);
    });

    it("should sort custom metric names alphabetically", async () => {
      vi.mocked(prisma.metric.findMany).mockResolvedValue([
        { metrics: { zebra: 1, alpha: 2, beta: 3 }, taskRun: { srcTaskId: "task1" } },
      ] as any);

      const result = await getAvailableMetrics({
        organizationId: "org-123",
        dagId: "my_dag",
      });

      expect(result.customMetrics).toEqual(["alpha", "beta", "zebra"]);
    });

    it("should filter out non-numeric custom metrics", async () => {
      vi.mocked(prisma.metric.findMany).mockResolvedValue([
        { metrics: { numeric_val: 123, string_val: "hello", connection_id: "my-conn" }, taskRun: { srcTaskId: "task1" } },
      ] as any);

      const result = await getAvailableMetrics({
        organizationId: "org-123",
        dagId: "my_dag",
      });

      expect(result.customMetrics).toEqual(["numeric_val"]);
      expect(result.customMetrics).not.toContain("string_val");
      expect(result.customMetrics).not.toContain("connection_id");
    });
  });
});
