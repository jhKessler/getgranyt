import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateComputedMetricsOnRunComplete,
  updateComputedMetricsOnMetricsIngest,
  getComputedMetrics,
  recalculateComputedMetrics,
} from "./computed.service";
import { Timeframe } from "../dashboard/types";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dagComputedMetrics: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    dagRun: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    metric: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("DAG Computed Metrics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateComputedMetricsOnRunComplete", () => {
    const baseParams = {
      organizationId: "org-123",
      dagId: "my_dag",
      environment: "production",
      runStatus: "success" as const,
      runDuration: 120,
      startTime: new Date(),
    };

    it("should create new metrics record if none exists", async () => {
      vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({
        id: "metrics-1",
        organizationId: "org-123",
        dagId: "my_dag",
        environment: "production",
        timeframe: "7d",
        totalRuns: 1,
        successfulRuns: 1,
        failedRuns: 0,
        totalRows: BigInt(0),
        totalDuration: BigInt(120),
        customMetrics: null,
        lastComputedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await updateComputedMetricsOnRunComplete(baseParams);

      // Should update all three timeframes (24h, 7d, 30d)
      expect(prisma.dagComputedMetrics.upsert).toHaveBeenCalledTimes(3);
    });

    it("should increment success count for successful runs", async () => {
      vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({} as any);

      await updateComputedMetricsOnRunComplete({
        ...baseParams,
        runStatus: "success",
      });

      const upsertCall = vi.mocked(prisma.dagComputedMetrics.upsert).mock.calls[0];
      const createData = upsertCall[0].create;

      expect(createData.successfulRuns).toBe(1);
      expect(createData.failedRuns).toBe(0);
    });

    it("should increment failed count for failed runs", async () => {
      vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({} as any);

      await updateComputedMetricsOnRunComplete({
        ...baseParams,
        runStatus: "failed",
      });

      const upsertCall = vi.mocked(prisma.dagComputedMetrics.upsert).mock.calls[0];
      const createData = upsertCall[0].create;

      expect(createData.successfulRuns).toBe(0);
      expect(createData.failedRuns).toBe(1);
    });

    it("should update metrics for all applicable timeframes", async () => {
      vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({} as any);

      await updateComputedMetricsOnRunComplete(baseParams);

      const timeframes = vi
        .mocked(prisma.dagComputedMetrics.upsert)
        .mock.calls.map((call) => call[0]?.where?.organizationId_dagId_environment_timeframe?.timeframe);

      expect(timeframes).toContain("24h");
      expect(timeframes).toContain("7d");
      expect(timeframes).toContain("28d");
    });

    it("should merge custom metrics correctly", async () => {
      vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({} as any);

      await updateComputedMetricsOnRunComplete({
        ...baseParams,
        customMetrics: { processing_time: 45.5, record_count: 1000 },
      });

      const upsertCall = vi.mocked(prisma.dagComputedMetrics.upsert).mock.calls[0];
      const createData = upsertCall[0].create;

      expect(createData.customMetrics).toEqual({
        processing_time: { sum: 45.5, count: 1, lastValue: 45.5 },
        record_count: { sum: 1000, count: 1, lastValue: 1000 },
      });
    });
  });

  describe("updateComputedMetricsOnMetricsIngest", () => {
    it("should update row counts", async () => {
      vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({} as any);

      await updateComputedMetricsOnMetricsIngest({
        organizationId: "org-123",
        dagId: "my_dag",
        environment: "production",
        rowCount: BigInt(5000),
        startTime: new Date(),
      });

      expect(prisma.dagComputedMetrics.upsert).toHaveBeenCalled();
    });
  });

  describe("getComputedMetrics", () => {
    it("should return computed metrics for a DAG", async () => {
      const mockMetrics = {
        id: "metrics-1",
        organizationId: "org-123",
        dagId: "my_dag",
        environment: "production",
        timeframe: "7d",
        totalRuns: 100,
        successfulRuns: 95,
        failedRuns: 5,
        totalRows: BigInt(500000),
        totalDuration: BigInt(12000),
        customMetrics: {
          processing_time: { sum: 4500, count: 100 },
        },
        lastComputedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.dagComputedMetrics.findFirst).mockResolvedValue(
        mockMetrics as any
      );

      const result = await getComputedMetrics({
        organizationId: "org-123",
        dagId: "my_dag",
        environment: "production",
        timeframe: Timeframe.Week,
      });

      expect(result).not.toBeNull();
      expect(result!.totalRuns).toBe(100);
      expect(result!.successRate).toBe(95);
      expect(result!.avgDuration).toBe(120); // 12000 / 100
      expect(result!.avgRows).toBe(5000); // 500000 / 100
    });

    it("should return null when no metrics exist", async () => {
      vi.mocked(prisma.dagComputedMetrics.findFirst).mockResolvedValue(null);

      const result = await getComputedMetrics({
        organizationId: "org-123",
        dagId: "my_dag",
        timeframe: Timeframe.Week,
      });

      expect(result).toBeNull();
    });

    it("should calculate averages correctly for custom metrics", async () => {
      const mockMetrics = {
        id: "metrics-1",
        organizationId: "org-123",
        dagId: "my_dag",
        environment: null,
        timeframe: "7d",
        totalRuns: 10,
        successfulRuns: 10,
        failedRuns: 0,
        totalRows: BigInt(10000),
        totalDuration: BigInt(1000),
        customMetrics: {
          latency_ms: { sum: 500, count: 10 },
        },
        lastComputedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.dagComputedMetrics.findFirst).mockResolvedValue(
        mockMetrics as any
      );

      const result = await getComputedMetrics({
        organizationId: "org-123",
        dagId: "my_dag",
        timeframe: Timeframe.Week,
      });

      expect(result!.customMetrics).toEqual({
        latency_ms: { sum: 500, count: 10 },
      });
    });
  });

  describe("recalculateComputedMetrics", () => {
    it("should recalculate all metrics from scratch", async () => {
      // Mock existing runs
      vi.mocked(prisma.dagRun.findMany).mockResolvedValue([
        {
          id: "run-1",
          status: "success",
          duration: 60,
          startTime: new Date(),
          _count: { alerts: 0 },
        },
        {
          id: "run-2",
          status: "failed",
          duration: 30,
          startTime: new Date(),
          _count: { alerts: 0 },
        },
      ] as any);

      // Mock data metrics for custom metrics lookup
      vi.mocked(prisma.metric.findMany).mockResolvedValue([]);

      vi.mocked(prisma.metric.aggregate).mockResolvedValue({
        _sum: { rowCount: 5000 },
      } as any);

      vi.mocked(prisma.dagComputedMetrics.deleteMany).mockResolvedValue({
        count: 1,
      });
      vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({} as any);

      await recalculateComputedMetrics({
        organizationId: "org-123",
        dagId: "my_dag",
        environment: "production",
      });

      expect(prisma.dagComputedMetrics.deleteMany).toHaveBeenCalled();
      expect(prisma.dagComputedMetrics.upsert).toHaveBeenCalled();
    });
  });
});
