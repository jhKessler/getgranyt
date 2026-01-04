import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertSensitivity } from "@prisma/client";
import { rowCountDropDetector } from "./index";
import type { DetectorContext, EffectiveAlertSettings } from "../../types";

// Mock prisma - using new Metric model
vi.mock("@/lib/prisma", () => ({
  prisma: {
    metric: {
      findMany: vi.fn(),
    },
    dagRun: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Row Count Drop Detector (Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createContext = (overrides: Partial<DetectorContext> = {}): DetectorContext => ({
    organizationId: "org-1",
    srcDagId: "test_dag",
    captureId: "capture_1",
    dagRunId: "run-1",
    taskRunId: "task-1",
    environment: "production",
    rowCount: 1000,
    ...overrides,
  });

  const defaultSettings: EffectiveAlertSettings = {
    enabled: true,
    sensitivity: AlertSensitivity.MEDIUM,
    customThreshold: null,
  };

  const mockHistoryWithValues = (rowCounts: number[], dayOfWeek: number = 1) => {
    const mockData = rowCounts.map((rowCount, i) => ({
      metrics: { row_count: rowCount },
      capturedAt: new Date(Date.now() - (i + 1) * 86400000),
      taskRun: {
        dagRun: {
          runType: "scheduled",
          startTime: new Date(Date.now() - (i + 1) * 86400000),
        },
      },
    }));

    // Override day of week calculation by setting proper dates
    mockData.forEach((item, i) => {
      // Set dates so they fall on the target day of week
      const date = new Date(Date.now() - (i + 1) * 86400000);
      while (date.getUTCDay() !== dayOfWeek) {
        date.setDate(date.getDate() - 1);
      }
      item.capturedAt = date;
      item.taskRun.dagRun.startTime = date;
    });

    vi.mocked(prisma.metric.findMany).mockResolvedValue(mockData as any);
  };

  const mockDagRun = (startTime: Date = new Date(), runType: string = "scheduled") => {
    vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({
      startTime,
      runType,
    } as any);
  };

  // ============================================================================
  // Basic Detection
  // ============================================================================

  describe("Basic Detection", () => {
    it("should return null when less than minimum historical runs", async () => {
      mockHistoryWithValues(Array(4).fill(1000)); // Only 4 runs
      mockDagRun();

      const ctx = createContext({ rowCount: 0 });
      const result = await rowCountDropDetector.detect(ctx, defaultSettings);

      expect(result).toBeNull();
    });

    it("should detect drop when row count goes to 0", async () => {
      mockHistoryWithValues(Array(15).fill(10000));
      mockDagRun();

      const ctx = createContext({ rowCount: 0 });
      const result = await rowCountDropDetector.detect(ctx, defaultSettings);

      expect(result).not.toBeNull();
      expect(result?.shouldAlert).toBe(true);
      expect(result?.severity).toBe("warning"); // All current events are warnings for now
    });

    it("should detect warning when row count drops significantly", async () => {
      mockHistoryWithValues(Array(15).fill(10000));
      mockDagRun();

      const ctx = createContext({ rowCount: 100 }); // 99% drop
      const result = await rowCountDropDetector.detect(ctx, defaultSettings);

      expect(result).not.toBeNull();
      expect(result?.shouldAlert).toBe(true);
      expect(result?.severity).toBe("warning");
    });

    it("should NOT alert when drop is within acceptable range", async () => {
      mockHistoryWithValues(Array(15).fill(10000));
      mockDagRun();

      const ctx = createContext({ rowCount: 9000 }); // Only 10% drop
      const result = await rowCountDropDetector.detect(ctx, defaultSettings);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should return null when sensitivity is DISABLED", async () => {
      const ctx = createContext({ rowCount: 0 });
      const disabledSettings: EffectiveAlertSettings = {
        enabled: true,
        sensitivity: AlertSensitivity.DISABLED,
        customThreshold: null,
      };

      const result = await rowCountDropDetector.detect(ctx, disabledSettings);
      expect(result).toBeNull();
    });

    it("should return null when rowCount is undefined", async () => {
      const ctx = createContext({ rowCount: undefined });
      const result = await rowCountDropDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });

    it("should return null when captureId is null", async () => {
      const ctx = createContext({ captureId: null, rowCount: 0 });
      const result = await rowCountDropDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });

    it("should NOT alert when pipeline normally has zeros", async () => {
      // 20% of runs are zeros (above zeroToleranceThreshold)
      const history = [...Array(4).fill(0), ...Array(16).fill(10000)];
      mockHistoryWithValues(history);
      mockDagRun();

      const ctx = createContext({ rowCount: 0 });
      const result = await rowCountDropDetector.detect(ctx, defaultSettings);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Sensitivity Levels
  // ============================================================================

  describe("Sensitivity Levels", () => {
    beforeEach(() => {
      mockHistoryWithValues(Array(20).fill(10000));
      mockDagRun();
    });

    it("should respect LOW sensitivity (99% drop required)", async () => {
      const lowSettings: EffectiveAlertSettings = {
        enabled: true,
        sensitivity: AlertSensitivity.LOW,
        customThreshold: null,
      };

      // 95% drop should NOT trigger at LOW
      const ctx = createContext({ rowCount: 500 });
      const result = await rowCountDropDetector.detect(ctx, lowSettings);
      expect(result).toBeNull();
    });

    it("should respect HIGH sensitivity (90% drop triggers)", async () => {
      const highSettings: EffectiveAlertSettings = {
        enabled: true,
        sensitivity: AlertSensitivity.HIGH,
        customThreshold: null,
      };

      // 92% drop should trigger at HIGH
      const ctx = createContext({ rowCount: 800 });
      const result = await rowCountDropDetector.detect(ctx, highSettings);
      expect(result).not.toBeNull();
    });

    it("should respect CUSTOM threshold", async () => {
      const customSettings: EffectiveAlertSettings = {
        enabled: true,
        sensitivity: AlertSensitivity.CUSTOM,
        customThreshold: 50, // 50% drop triggers
      };

      // 60% drop should trigger at 50% threshold
      const ctx = createContext({ rowCount: 4000 });
      const result = await rowCountDropDetector.detect(ctx, customSettings);
      expect(result).not.toBeNull();
    });
  });

  // ============================================================================
  // Metadata
  // ============================================================================

  describe("Metadata", () => {
    it("should include confidence in metadata", async () => {
      mockHistoryWithValues(Array(20).fill(10000));
      mockDagRun();

      const ctx = createContext({ rowCount: 0 });
      const result = await rowCountDropDetector.detect(ctx, defaultSettings);

      expect(result).not.toBeNull();
      expect(result?.metadata.confidence).toBeDefined();
      expect(["high", "medium", "low"]).toContain(result?.metadata.confidence);
    });

    it("should include baseline info in metadata", async () => {
      mockHistoryWithValues(Array(20).fill(10000));
      mockDagRun();

      const ctx = createContext({ rowCount: 0 });
      const result = await rowCountDropDetector.detect(ctx, defaultSettings);

      expect(result).not.toBeNull();
      expect(result?.metadata.baseline).toBeDefined();
      expect(result?.metadata.baselineType).toBeDefined();
    });
  });
});
