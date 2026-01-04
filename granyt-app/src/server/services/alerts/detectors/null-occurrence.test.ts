import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertSensitivity } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";
import { nullOccurrenceDetector } from "./null-occurrence";
import type { DetectorContext, EffectiveAlertSettings, ColumnInfo } from "../types";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    metric: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

// Helper to cast ColumnInfo[] to JsonValue for test mocks
const toJsonValue = (columns: ColumnInfo[] | null): JsonValue => columns as unknown as JsonValue;

describe("Null Occurrence Detector", () => {
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
    columnCount: 3,
    columns: [
      { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
      { name: "name", dtype: "object", null_count: 5, empty_string_count: 2 },
      { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
    ],
    ...overrides,
  });

  const defaultSettings: EffectiveAlertSettings = {
    enabled: true,
    sensitivity: AlertSensitivity.MEDIUM,
    customThreshold: null,
  };

  const createHistoricalColumns = (withNulls: Record<string, boolean> = {}): ColumnInfo[] => [
    { name: "id", dtype: "int64", null_count: withNulls["id"] ? 3 : 0, empty_string_count: null },
    { name: "name", dtype: "object", null_count: withNulls["name"] ? 10 : 0, empty_string_count: 2 },
    { name: "email", dtype: "object", null_count: withNulls["email"] ? 5 : 0, empty_string_count: 0 },
  ];

  describe("when there is insufficient history", () => {
    it("should return null when less than 4 historical occurrences", async () => {
      // Only 3 historical occurrences - mock the service's select
      vi.mocked(prisma.metric.findMany).mockResolvedValue(
        Array(3).fill(null).map((_, i) => {
          const cols = createHistoricalColumns();
          return {
            metrics: {},
            schema: {
              column_dtypes: Object.fromEntries(cols.map(c => [c.name, c.dtype])),
              null_counts: Object.fromEntries(cols.map(c => [c.name, c.null_count])),
              empty_string_counts: Object.fromEntries(cols.map(c => [c.name, c.empty_string_count])),
            },
            capturedAt: new Date(Date.now() - i * 3600000),
          };
        })
      );

      const result = await nullOccurrenceDetector.detect(createContext(), defaultSettings);
      expect(result).toBeNull();
    });
  });

  describe("when there is sufficient history", () => {
    const mockHistoryWithColumns = (columns: ColumnInfo[][]) => {
      vi.mocked(prisma.metric.findMany).mockResolvedValue(
        columns.map((cols, i) => ({
          metrics: {},
          schema: {
            column_dtypes: Object.fromEntries(cols.map(c => [c.name, c.dtype])),
            null_counts: Object.fromEntries(cols.map(c => [c.name, c.null_count])),
            empty_string_counts: Object.fromEntries(cols.map(c => [c.name, c.empty_string_count])),
          },
          capturedAt: new Date(Date.now() - i * 3600000),
        }))
      );
    };

    it("should return null when column has no nulls", async () => {
      // History with no nulls in any column
      mockHistoryWithColumns(Array(5).fill(createHistoricalColumns()));

      // Current context also has no nulls in tracked columns
      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
          { name: "name", dtype: "object", null_count: 0, empty_string_count: 2 },
          { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
        ],
      });
      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });

    it("should return null when column historically had nulls", async () => {
      // History where 'name' has had nulls before
      mockHistoryWithColumns(Array(5).fill(createHistoricalColumns({ name: true })));

      // Current context has nulls in 'name' column
      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
          { name: "name", dtype: "object", null_count: 15, empty_string_count: 2 },
          { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
        ],
      });
      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });

    it("should detect new null occurrence in column that never had nulls", async () => {
      // History with no nulls in any column
      mockHistoryWithColumns(Array(5).fill(createHistoricalColumns()));

      // Current context has nulls in 'id' column which never had nulls
      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: 10, empty_string_count: null },
          { name: "name", dtype: "object", null_count: 0, empty_string_count: 2 },
          { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
        ],
      });
      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);

      expect(result).not.toBeNull();
      expect(result?.shouldAlert).toBe(true);
      expect(result?.metadata.affectedColumns).toHaveLength(1);
      expect((result?.metadata.affectedColumns as Array<{name: string}>)[0].name).toBe("id");
    });

    it("should detect multiple columns with new null occurrences", async () => {
      // History with no nulls
      mockHistoryWithColumns(Array(5).fill(createHistoricalColumns()));

      // Current context has nulls in both 'id' and 'email' columns
      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: 10, empty_string_count: null },
          { name: "name", dtype: "object", null_count: 0, empty_string_count: 2 },
          { name: "email", dtype: "object", null_count: 5, empty_string_count: 0 },
        ],
      });
      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);

      expect(result).not.toBeNull();
      expect(result?.shouldAlert).toBe(true);
      expect(result?.metadata.affectedColumns).toHaveLength(2);
      expect(result?.severity).toBe("warning"); // All current events are warnings for now
    });

    it("should NOT alert for new columns not present in history", async () => {
      // History without 'new_column'
      mockHistoryWithColumns(Array(5).fill(createHistoricalColumns()));

      // Current context has a new column with nulls
      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
          { name: "name", dtype: "object", null_count: 0, empty_string_count: 2 },
          { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
          { name: "new_column", dtype: "object", null_count: 100, empty_string_count: 0 },
        ],
      });
      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });

    it("should skip columns without null tracking (null_count is null)", async () => {
      mockHistoryWithColumns(Array(5).fill(createHistoricalColumns()));

      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: null, empty_string_count: null }, // No tracking
          { name: "name", dtype: "object", null_count: 0, empty_string_count: 2 },
          { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
        ],
      });
      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });
  });

  describe("sensitivity levels", () => {
    const mockHistoryWithColumns = (columns: ColumnInfo[][]) => {
      vi.mocked(prisma.metric.findMany).mockResolvedValue(
        columns.map((cols, i) => ({
          metrics: {},
          schema: {
            column_dtypes: Object.fromEntries(cols.map(c => [c.name, c.dtype])),
            null_counts: Object.fromEntries(cols.map(c => [c.name, c.null_count])),
            empty_string_counts: Object.fromEntries(cols.map(c => [c.name, c.empty_string_count])),
          },
          capturedAt: new Date(Date.now() - i * 3600000),
        }))
      );
    };

    it("should return warning for single column at MEDIUM sensitivity", async () => {
      mockHistoryWithColumns(Array(5).fill(createHistoricalColumns()));

      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: 10, empty_string_count: null },
          { name: "name", dtype: "object", null_count: 0, empty_string_count: 2 },
          { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
        ],
      });
      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);

      expect(result?.severity).toBe("warning");
    });

    it("should return warning when multiple columns affected", async () => {
      mockHistoryWithColumns(Array(5).fill(createHistoricalColumns()));

      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: 10, empty_string_count: null },
          { name: "name", dtype: "object", null_count: 5, empty_string_count: 2 },
          { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
        ],
      });

      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);

      expect(result?.severity).toBe("warning"); // All current events are warnings for now
    });

    it("should return null when disabled", async () => {
      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: 10, empty_string_count: null },
        ],
      });
      const disabledSettings: EffectiveAlertSettings = {
        enabled: false,
        sensitivity: AlertSensitivity.MEDIUM,
        customThreshold: null,
      };

      const result = await nullOccurrenceDetector.detect(ctx, disabledSettings);
      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should return null when columns is undefined", async () => {
      const ctx = createContext({ columns: undefined });
      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });

    it("should return null when columns is empty", async () => {
      const ctx = createContext({ columns: [] });
      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });

    it("should return null when captureId is null", async () => {
      const ctx = createContext({ captureId: null });
      const result = await nullOccurrenceDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });
  });
});
