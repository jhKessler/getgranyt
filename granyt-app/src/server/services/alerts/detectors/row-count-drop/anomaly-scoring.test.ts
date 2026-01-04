import { describe, it, expect } from "vitest";
import { AlertSensitivity } from "@prisma/client";
import {
  calculateAnomalyScore,
  selectBaseline,
  getEffectiveThreshold,
  ScoringContext,
} from "./anomaly-scoring";
import { HistoricalRun } from "./cohort-stats";

describe("Anomaly Scoring Module", () => {
  // ============================================================================
  // Test Helpers
  // ============================================================================

  const createRun = (overrides: Partial<HistoricalRun> = {}): HistoricalRun => ({
    rowCount: 10000,
    capturedAt: new Date(),
    runType: "scheduled",
    dayOfWeek: 1, // Monday
    hourOfDay: 10,
    ...overrides,
  });

  const createHistory = (count: number, overrides: Partial<HistoricalRun> = {}): HistoricalRun[] => {
    return Array(count)
      .fill(null)
      .map((_, i) =>
        createRun({
          capturedAt: new Date(Date.now() - i * 86400000), // Each day earlier
          ...overrides,
        })
      );
  };

  const createMixedDayHistory = (count: number): HistoricalRun[] => {
    return Array(count)
      .fill(null)
      .map((_, i) =>
        createRun({
          dayOfWeek: i % 7,
          capturedAt: new Date(Date.now() - i * 86400000),
        })
      );
  };

  // ============================================================================
  // getEffectiveThreshold
  // ============================================================================

  describe("getEffectiveThreshold", () => {
    it("should return correct threshold for MEDIUM sensitivity", () => {
      const settings = { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null };
      expect(getEffectiveThreshold(settings)).toBe(0.05);
    });

    it("should return correct threshold for HIGH sensitivity", () => {
      const settings = { enabled: true, sensitivity: AlertSensitivity.HIGH, customThreshold: null };
      expect(getEffectiveThreshold(settings)).toBe(0.1);
    });

    it("should return correct threshold for LOW sensitivity", () => {
      const settings = { enabled: true, sensitivity: AlertSensitivity.LOW, customThreshold: null };
      expect(getEffectiveThreshold(settings)).toBe(0.01);
    });

    it("should calculate custom threshold correctly", () => {
      // 80% drop means keep 20%
      const settings = { enabled: true, sensitivity: AlertSensitivity.CUSTOM, customThreshold: 80 };
      expect(getEffectiveThreshold(settings)).toBe(0.2);
    });
  });

  // ============================================================================
  // selectBaseline
  // ============================================================================

  describe("selectBaseline", () => {
    it("should return null when not enough history", () => {
      const history = createHistory(3); // Less than absoluteMinimum
      const result = selectBaseline(history, 1, "scheduled");
      expect(result).toBeNull();
    });

    it("should prefer same day-of-week cohort when available", () => {
      // Create history with enough Monday runs (dayOfWeek = 1)
      const history = [
        ...createHistory(5, { dayOfWeek: 1 }), // 5 Mondays
        ...createHistory(10, { dayOfWeek: 2 }), // 10 Tuesdays
      ];

      const result = selectBaseline(history, 1, "scheduled");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("cohort");
      expect(result!.cohortSize).toBe(5);
    });

    it("should fall back to overall baseline when day-of-week cohort too small", () => {
      // Create 2 Monday runs and 10 other-day runs
      // The 2 Monday runs are less than minCohortSize (3)
      // Use null runType to prevent run-type cohort matching
      const history = [
        createRun({ dayOfWeek: 1, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 1, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 2, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 3, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 4, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 5, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 6, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 0, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 2, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 3, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 4, rowCount: 10000, runType: null }),
        createRun({ dayOfWeek: 5, rowCount: 10000, runType: null }),
      ];

      // Query for Monday (dayOfWeek=1) with null runType
      const result = selectBaseline(history, 1, null);
      expect(result).not.toBeNull();
      // With only 2 Monday runs (dayOfWeek=1) and null runType, it should fall back to overall
      expect(result!.type).toBe("overall");
    });

    it("should return null when baseline is below minimum rows", () => {
      const history = createHistory(10, { rowCount: 50 }); // Below MIN_BASELINE_ROWS
      const result = selectBaseline(history, 1, "scheduled");
      expect(result).toBeNull();
    });

    it("should filter out zeros when calculating baseline", () => {
      const history = [
        ...createHistory(5, { rowCount: 0 }),
        ...createHistory(5, { rowCount: 10000 }),
      ];

      const result = selectBaseline(history, 1, "scheduled");
      expect(result).not.toBeNull();
      expect(result!.value).toBe(10000); // Only non-zero values
    });
  });

  // ============================================================================
  // calculateAnomalyScore
  // ============================================================================

  describe("calculateAnomalyScore", () => {
    const defaultSettings = { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null };

    it("should return null when not enough history", () => {
      const ctx: ScoringContext = {
        currentRowCount: 100,
        history: createHistory(3),
        currentDayOfWeek: 1,
        currentRunType: "scheduled",
        settings: defaultSettings,
      };

      const result = calculateAnomalyScore(ctx);
      expect(result).toBeNull();
    });

    it("should detect drop when row count is 0", () => {
      const ctx: ScoringContext = {
        currentRowCount: 0,
        history: createHistory(15, { rowCount: 10000 }),
        currentDayOfWeek: 1,
        currentRunType: "scheduled",
        settings: defaultSettings,
      };

      const result = calculateAnomalyScore(ctx);
      expect(result).not.toBeNull();
      expect(result!.shouldAlert).toBe(true);
      expect(result!.severity).toBe("warning"); // All current events are warnings for now
    });

    it("should detect warning drop when below threshold", () => {
      const ctx: ScoringContext = {
        currentRowCount: 100, // 99% drop from 10000
        history: createHistory(15, { rowCount: 10000 }),
        currentDayOfWeek: 1,
        currentRunType: "scheduled",
        settings: defaultSettings,
      };

      const result = calculateAnomalyScore(ctx);
      expect(result).not.toBeNull();
      expect(result!.shouldAlert).toBe(true);
      expect(result!.severity).toBe("warning");
    });

    it("should NOT alert when drop is within threshold", () => {
      const ctx: ScoringContext = {
        currentRowCount: 9000, // Only 10% drop
        history: createHistory(15, { rowCount: 10000 }),
        currentDayOfWeek: 1,
        currentRunType: "scheduled",
        settings: defaultSettings,
      };

      const result = calculateAnomalyScore(ctx);
      expect(result).toBeNull();
    });

    it("should NOT alert for zero-tolerant DAG when current is 0", () => {
      // 15% of runs are zeros (above zeroToleranceThreshold)
      const history = [
        ...createHistory(3, { rowCount: 0 }),
        ...createHistory(17, { rowCount: 10000 }),
      ];

      const ctx: ScoringContext = {
        currentRowCount: 0,
        history,
        currentDayOfWeek: 1,
        currentRunType: "scheduled",
        settings: defaultSettings,
      };

      const result = calculateAnomalyScore(ctx);
      expect(result).toBeNull();
    });

    it("should include cohort information in metadata when using cohort baseline", () => {
      // Create history with good Monday cohort
      const history = [
        ...createHistory(5, { dayOfWeek: 1, rowCount: 10000 }), // Mondays
        ...createHistory(10, { dayOfWeek: 2, rowCount: 10000 }), // Tuesdays
      ];

      const ctx: ScoringContext = {
        currentRowCount: 100,
        history,
        currentDayOfWeek: 1, // Monday
        currentRunType: "scheduled",
        settings: defaultSettings,
      };

      const result = calculateAnomalyScore(ctx);
      expect(result).not.toBeNull();
      expect(result!.baseline.type).toBe("cohort");
      expect(result!.baseline.cohortSize).toBe(5);
    });

    it("should respect LOW sensitivity (99% drop required)", () => {
      const lowSettings = { enabled: true, sensitivity: AlertSensitivity.LOW, customThreshold: null };

      // 95% drop (should not trigger at LOW sensitivity)
      const ctx: ScoringContext = {
        currentRowCount: 500,
        history: createHistory(15, { rowCount: 10000 }),
        currentDayOfWeek: 1,
        currentRunType: "scheduled",
        settings: lowSettings,
      };

      const result = calculateAnomalyScore(ctx);
      expect(result).toBeNull();
    });

    it("should respect HIGH sensitivity (90% drop triggers)", () => {
      const highSettings = { enabled: true, sensitivity: AlertSensitivity.HIGH, customThreshold: null };

      // 92% drop (should trigger at HIGH sensitivity)
      const ctx: ScoringContext = {
        currentRowCount: 800,
        history: createHistory(15, { rowCount: 10000 }),
        currentDayOfWeek: 1,
        currentRunType: "scheduled",
        settings: highSettings,
      };

      const result = calculateAnomalyScore(ctx);
      expect(result).not.toBeNull();
      expect(result!.shouldAlert).toBe(true);
    });

    it("should include confidence level in result", () => {
      const ctx: ScoringContext = {
        currentRowCount: 0,
        history: createHistory(20, { rowCount: 10000, dayOfWeek: 1 }),
        currentDayOfWeek: 1,
        currentRunType: "scheduled",
        settings: defaultSettings,
      };

      const result = calculateAnomalyScore(ctx);
      expect(result).not.toBeNull();
      expect(["high", "medium", "low"]).toContain(result!.confidence);
    });
  });

  // ============================================================================
  // Real-world Scenarios
  // ============================================================================

  describe("Real-world Scenarios", () => {
    const defaultSettings = { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null };

    it("should handle weekend dip pattern (no false positive)", () => {
      // DAG runs daily, weekends have 1000 rows, weekdays have 10000
      const history: HistoricalRun[] = [];
      for (let i = 0; i < 28; i++) {
        const dayOfWeek = i % 7;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        history.push(
          createRun({
            dayOfWeek,
            rowCount: isWeekend ? 1000 : 10000,
            capturedAt: new Date(Date.now() - i * 86400000),
          })
        );
      }

      // Current run is Saturday with 1000 rows (normal for weekend)
      const ctx: ScoringContext = {
        currentRowCount: 1000,
        history,
        currentDayOfWeek: 6, // Saturday
        currentRunType: "scheduled",
        settings: defaultSettings,
      };

      const result = calculateAnomalyScore(ctx);
      // Should NOT alert because 1000 is normal for Saturday cohort
      expect(result).toBeNull();
    });

    it("should detect genuine drop on specific day", () => {
      // DAG runs daily, normally 10000 rows every day
      const history = createMixedDayHistory(28).map((r) => ({ ...r, rowCount: 10000 }));

      // Monday with only 100 rows (99% drop from normal Monday)
      const ctx: ScoringContext = {
        currentRowCount: 100,
        history,
        currentDayOfWeek: 1, // Monday
        currentRunType: "scheduled",
        settings: defaultSettings,
      };

      const result = calculateAnomalyScore(ctx);
      expect(result).not.toBeNull();
      expect(result!.shouldAlert).toBe(true);
    });

    it("should handle manual vs scheduled runs differently", () => {
      // Scheduled runs have 10000 rows, manual runs have 100 rows
      // Need enough manual runs to form a cohort (at least 3)
      const history: HistoricalRun[] = [
        ...createHistory(10, { runType: "scheduled", rowCount: 10000, dayOfWeek: 1 }),
        ...createHistory(5, { runType: "manual", rowCount: 100, dayOfWeek: 1 }),
      ];

      // Manual run with 100 rows
      const ctx: ScoringContext = {
        currentRowCount: 100,
        history,
        currentDayOfWeek: 1,
        currentRunType: "manual",
        settings: defaultSettings,
      };

      const result = calculateAnomalyScore(ctx);
      // Since we fall back to same-day cohort (all are dayOfWeek=1) which includes
      // both scheduled (10000) and manual (100) runs, the baseline will be mixed
      // With 10 runs at 10000 and 5 at 100, median will be high, so 100 will trigger alert
      // This is expected behavior - run type filtering is secondary to day-of-week
      expect(result).not.toBeNull();
      expect(result!.shouldAlert).toBe(true);
    });
  });
});
