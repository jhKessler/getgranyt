import { describe, it, expect } from "vitest";
import {
  mean,
  median,
  stdDev,
  percentile,
  zScore,
  calculateCohortStats,
  filterBySameDayOfWeek,
  filterByRunType,
  filterNonZero,
  extractRowCounts,
  HistoricalRun,
} from "./cohort-stats";

describe("Cohort Stats Module", () => {
  // ============================================================================
  // Statistical Functions
  // ============================================================================

  describe("mean", () => {
    it("should calculate mean correctly", () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
      expect(mean([10, 20, 30])).toBe(20);
    });

    it("should return 0 for empty array", () => {
      expect(mean([])).toBe(0);
    });

    it("should handle single value", () => {
      expect(mean([42])).toBe(42);
    });
  });

  describe("median", () => {
    it("should calculate median for odd-length array", () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3);
    });

    it("should calculate median for even-length array", () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    it("should return 0 for empty array", () => {
      expect(median([])).toBe(0);
    });

    it("should handle single value", () => {
      expect(median([42])).toBe(42);
    });
  });

  describe("stdDev", () => {
    it("should calculate standard deviation", () => {
      const values = [10, 12, 23, 23, 16, 23, 21, 16];
      const result = stdDev(values);
      expect(result).toBeCloseTo(4.898, 2);
    });

    it("should return 0 for array with less than 2 elements", () => {
      expect(stdDev([])).toBe(0);
      expect(stdDev([42])).toBe(0);
    });

    it("should return 0 for identical values", () => {
      expect(stdDev([5, 5, 5, 5])).toBe(0);
    });
  });

  describe("percentile", () => {
    it("should calculate percentiles correctly", () => {
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(percentile(sorted, 50)).toBe(5.5);
      expect(percentile(sorted, 0)).toBe(1);
      expect(percentile(sorted, 100)).toBe(10);
    });

    it("should return 0 for empty array", () => {
      expect(percentile([], 50)).toBe(0);
    });

    it("should handle single value", () => {
      expect(percentile([42], 50)).toBe(42);
    });
  });

  describe("zScore", () => {
    it("should calculate z-score correctly", () => {
      // Value is 2 standard deviations above mean
      expect(zScore(120, 100, 10)).toBe(2);
      // Value is 1 standard deviation below mean
      expect(zScore(90, 100, 10)).toBe(-1);
    });

    it("should return 0 when value equals mean", () => {
      expect(zScore(100, 100, 10)).toBe(0);
    });

    it("should return Infinity when stdDev is 0 and value differs", () => {
      expect(zScore(101, 100, 0)).toBe(Infinity);
    });

    it("should return 0 when stdDev is 0 and value equals mean", () => {
      expect(zScore(100, 100, 0)).toBe(0);
    });
  });

  // ============================================================================
  // Cohort Statistics
  // ============================================================================

  describe("calculateCohortStats", () => {
    it("should calculate comprehensive stats", () => {
      const values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
      const stats = calculateCohortStats(values);

      expect(stats.count).toBe(10);
      expect(stats.mean).toBe(550);
      expect(stats.median).toBe(550);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(1000);
      expect(stats.zeroRate).toBe(0);
    });

    it("should handle array with zeros", () => {
      const values = [0, 100, 200, 0, 300];
      const stats = calculateCohortStats(values);

      expect(stats.zeroRate).toBe(0.4); // 2/5 = 40%
    });

    it("should return zeros for empty array", () => {
      const stats = calculateCohortStats([]);

      expect(stats.count).toBe(0);
      expect(stats.mean).toBe(0);
      expect(stats.median).toBe(0);
    });
  });

  // ============================================================================
  // Filtering Functions
  // ============================================================================

  const createRun = (overrides: Partial<HistoricalRun> = {}): HistoricalRun => ({
    rowCount: 1000,
    capturedAt: new Date(),
    runType: "scheduled",
    dayOfWeek: 1, // Monday
    hourOfDay: 10,
    ...overrides,
  });

  describe("filterBySameDayOfWeek", () => {
    it("should filter by day of week", () => {
      const runs = [
        createRun({ dayOfWeek: 1 }), // Monday
        createRun({ dayOfWeek: 2 }), // Tuesday
        createRun({ dayOfWeek: 1 }), // Monday
        createRun({ dayOfWeek: 5 }), // Friday
      ];

      const mondayRuns = filterBySameDayOfWeek(runs, 1);
      expect(mondayRuns).toHaveLength(2);
    });

    it("should return empty array when no matches", () => {
      const runs = [createRun({ dayOfWeek: 1 }), createRun({ dayOfWeek: 2 })];

      const sundayRuns = filterBySameDayOfWeek(runs, 0);
      expect(sundayRuns).toHaveLength(0);
    });
  });

  describe("filterByRunType", () => {
    it("should filter by run type", () => {
      const runs = [
        createRun({ runType: "manual" }),
        createRun({ runType: "scheduled" }),
        createRun({ runType: "manual" }),
      ];

      const manualRuns = filterByRunType(runs, "manual");
      expect(manualRuns).toHaveLength(2);
    });

    it("should return all runs when targetRunType is null", () => {
      const runs = [createRun({ runType: "manual" }), createRun({ runType: "scheduled" })];

      const allRuns = filterByRunType(runs, null);
      expect(allRuns).toHaveLength(2);
    });
  });

  describe("filterNonZero", () => {
    it("should filter out zero row counts", () => {
      const runs = [createRun({ rowCount: 1000 }), createRun({ rowCount: 0 }), createRun({ rowCount: 500 })];

      const nonZeroRuns = filterNonZero(runs);
      expect(nonZeroRuns).toHaveLength(2);
      expect(nonZeroRuns.every((r) => r.rowCount > 0)).toBe(true);
    });
  });

  describe("extractRowCounts", () => {
    it("should extract row counts from runs", () => {
      const runs = [createRun({ rowCount: 100 }), createRun({ rowCount: 200 }), createRun({ rowCount: 300 })];

      const counts = extractRowCounts(runs);
      expect(counts).toEqual([100, 200, 300]);
    });
  });
});
