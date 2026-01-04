import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertSensitivity } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";
import { schemaChangeDetector } from "./schema-change";
import type { DetectorContext, EffectiveAlertSettings, ColumnInfo } from "../types";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    metric: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

// Helper to cast ColumnInfo[] to JsonValue for test mocks
const toJsonValue = (columns: ColumnInfo[] | null): JsonValue => columns as unknown as JsonValue;

describe("Schema Change Detector", () => {
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
      { name: "name", dtype: "object", null_count: 0, empty_string_count: 0 },
      { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
    ],
    ...overrides,
  });

  const defaultSettings: EffectiveAlertSettings = {
    enabled: true,
    sensitivity: AlertSensitivity.MEDIUM,
    customThreshold: null,
  };

  const createPreviousColumns = (): ColumnInfo[] => [
    { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
    { name: "name", dtype: "object", null_count: 0, empty_string_count: 0 },
    { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
  ];

  describe("when there is no previous metric", () => {
    it("should return null when no previous metric exists (first run)", async () => {
      vi.mocked(prisma.metric.findFirst).mockResolvedValue(null);

      const result = await schemaChangeDetector.detect(createContext(), defaultSettings);
      expect(result).toBeNull();
    });
  });

  describe("when there is a previous metric", () => {
    const mockPreviousMetric = (columns: ColumnInfo[]) => {
      vi.mocked(prisma.metric.findFirst).mockResolvedValue({
        metrics: {},
        schema: {
          column_dtypes: Object.fromEntries(columns.map(c => [c.name, c.dtype])),
          null_counts: Object.fromEntries(columns.map(c => [c.name, c.null_count])),
          empty_string_counts: Object.fromEntries(columns.map(c => [c.name, c.empty_string_count])),
        },
      } as any);
    };

    it("should return null when schema is unchanged", async () => {
      mockPreviousMetric(createPreviousColumns());

      const result = await schemaChangeDetector.detect(createContext(), defaultSettings);
      expect(result).toBeNull();
    });

    it("should detect added columns", async () => {
      mockPreviousMetric(createPreviousColumns());

      const ctx = createContext({
        columns: [
          ...createPreviousColumns(),
          { name: "created_at", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
        ],
      });

      const result = await schemaChangeDetector.detect(ctx, defaultSettings);
      
      expect(result).not.toBeNull();
      expect(result?.shouldAlert).toBe(true);
      expect(result?.severity).toBe("warning"); // Only added, no breaking changes
      expect(result?.metadata.summary).toEqual({
        addedCount: 1,
        removedCount: 0,
        typeChangedCount: 0,
        totalChanges: 1,
      });
      expect(result?.metadata.addedColumns).toEqual([
        { name: "created_at", type: "datetime64[ns]" },
      ]);
    });

    it("should detect removed columns with warning severity", async () => {
      mockPreviousMetric(createPreviousColumns());

      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
          { name: "name", dtype: "object", null_count: 0, empty_string_count: 0 },
          // email column removed
        ],
      });

      const result = await schemaChangeDetector.detect(ctx, defaultSettings);
      
      expect(result).not.toBeNull();
      expect(result?.shouldAlert).toBe(true);
      expect(result?.severity).toBe("warning"); // All current events are warnings for now
      expect(result?.metadata.summary).toEqual({
        addedCount: 0,
        removedCount: 1,
        typeChangedCount: 0,
        totalChanges: 1,
      });
      expect(result?.metadata.removedColumns).toEqual([
        { name: "email", type: "object" },
      ]);
    });

    it("should detect type changes with warning severity", async () => {
      mockPreviousMetric(createPreviousColumns());

      const ctx = createContext({
        columns: [
          { name: "id", dtype: "object", null_count: 0, empty_string_count: null }, // Changed from int64 to object
          { name: "name", dtype: "object", null_count: 0, empty_string_count: 0 },
          { name: "email", dtype: "object", null_count: 0, empty_string_count: 0 },
        ],
      });

      const result = await schemaChangeDetector.detect(ctx, defaultSettings);
      
      expect(result).not.toBeNull();
      expect(result?.shouldAlert).toBe(true);
      expect(result?.severity).toBe("warning"); // All current events are warnings for now
      expect(result?.metadata.summary).toEqual({
        addedCount: 0,
        removedCount: 0,
        typeChangedCount: 1,
        totalChanges: 1,
      });
      expect(result?.metadata.typeChangedColumns).toEqual([
        { name: "id", previousType: "int64", currentType: "object" },
      ]);
    });

    it("should detect multiple changes at once", async () => {
      mockPreviousMetric(createPreviousColumns());

      const ctx = createContext({
        columns: [
          { name: "id", dtype: "object", null_count: 0, empty_string_count: null }, // Type changed
          { name: "name", dtype: "object", null_count: 0, empty_string_count: 0 },
          // email removed
          { name: "phone", dtype: "object", null_count: 0, empty_string_count: 0 }, // Added
        ],
      });

      const result = await schemaChangeDetector.detect(ctx, defaultSettings);
      
      expect(result).not.toBeNull();
      expect(result?.shouldAlert).toBe(true);
      expect(result?.severity).toBe("warning"); // All current events are warnings for now
      expect(result?.metadata.summary).toEqual({
        addedCount: 1,
        removedCount: 1,
        typeChangedCount: 1,
        totalChanges: 3,
      });
    });

    it("should return warning for only added columns (non-breaking)", async () => {
      mockPreviousMetric(createPreviousColumns());

      const ctx = createContext({
        columns: [
          ...createPreviousColumns(),
          { name: "new_col1", dtype: "object", null_count: 0, empty_string_count: null },
          { name: "new_col2", dtype: "object", null_count: 0, empty_string_count: null },
        ],
      });

      const result = await schemaChangeDetector.detect(ctx, defaultSettings);
      
      expect(result?.severity).toBe("warning"); // Only additions = warning
    });

    it("should return null when disabled", async () => {
      mockPreviousMetric(createPreviousColumns());

      const ctx = createContext({
        columns: [
          { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
          // Removed name and email
        ],
      });

      const disabledSettings: EffectiveAlertSettings = {
        enabled: false,
        sensitivity: AlertSensitivity.MEDIUM,
        customThreshold: null,
      };

      const result = await schemaChangeDetector.detect(ctx, disabledSettings);
      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should return null when columns is undefined", async () => {
      const ctx = createContext({ columns: undefined });
      const result = await schemaChangeDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });

    it("should return null when columns is empty", async () => {
      const ctx = createContext({ columns: [] });
      const result = await schemaChangeDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });

    it("should return null when captureId is null", async () => {
      const ctx = createContext({ captureId: null });
      const result = await schemaChangeDetector.detect(ctx, defaultSettings);
      expect(result).toBeNull();
    });
  });
});
