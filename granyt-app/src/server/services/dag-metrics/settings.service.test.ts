import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getMetricsSettings,
  saveMetricsSettings,
  deleteMetricsSettings,
} from "./settings.service";
import {
  MetricType,
  DEFAULT_METRICS,
  MAX_SELECTED_METRICS,
  type MetricConfig,
} from "./types";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dagMetricsSettings: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("DAG Metrics Settings Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMetricsSettings", () => {
    const baseParams = {
      userId: "user-123",
      organizationId: "org-123",
    };

    it("should return DAG-specific settings when they exist", async () => {
      const dagSettings = {
        id: "settings-1",
        userId: "user-123",
        organizationId: "org-123",
        dagId: "my_dag",
        selectedMetrics: [
          { id: "total_runs", type: MetricType.Builtin, enabled: true, order: 0 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.dagMetricsSettings.findUnique).mockResolvedValue(
        dagSettings as any
      );

      const result = await getMetricsSettings({
        ...baseParams,
        dagId: "my_dag",
      });

      expect(result.dagId).toBe("my_dag");
      expect(result.isDefault).toBe(false);
      expect(result.selectedMetrics).toEqual(dagSettings.selectedMetrics);
      expect(prisma.dagMetricsSettings.findUnique).toHaveBeenCalledWith({
        where: {
          userId_organizationId_dagId: {
            userId: "user-123",
            organizationId: "org-123",
            dagId: "my_dag",
          },
        },
      });
    });

    it("should fall back to default settings when DAG-specific not found", async () => {
      const defaultSettings = {
        id: "settings-default",
        userId: "user-123",
        organizationId: "org-123",
        dagId: null,
        selectedMetrics: [
          { id: "success_rate", type: MetricType.Builtin, enabled: true, order: 0 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First call for DAG-specific returns null (findUnique)
      vi.mocked(prisma.dagMetricsSettings.findUnique).mockResolvedValueOnce(null);
      // Second call for default returns the default settings (findFirst for null dagId)
      vi.mocked(prisma.dagMetricsSettings.findFirst).mockResolvedValueOnce(defaultSettings as any);

      const result = await getMetricsSettings({
        ...baseParams,
        dagId: "my_dag",
      });

      expect(result.dagId).toBeNull();
      expect(result.isDefault).toBe(true);
      expect(result.selectedMetrics).toEqual(defaultSettings.selectedMetrics);
      expect(prisma.dagMetricsSettings.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.dagMetricsSettings.findFirst).toHaveBeenCalledTimes(1);
    });

    it("should return system default when no settings exist", async () => {
      vi.mocked(prisma.dagMetricsSettings.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagMetricsSettings.findFirst).mockResolvedValue(null);

      const result = await getMetricsSettings({
        ...baseParams,
        dagId: "my_dag",
      });

      expect(result.isDefault).toBe(true);
      expect(result.selectedMetrics).toEqual(DEFAULT_METRICS);
    });

    it("should return default settings directly when dagId is null", async () => {
      const defaultSettings = {
        id: "settings-default",
        userId: "user-123",
        organizationId: "org-123",
        dagId: null,
        selectedMetrics: DEFAULT_METRICS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.dagMetricsSettings.findFirst).mockResolvedValue(
        defaultSettings as any
      );

      const result = await getMetricsSettings({
        ...baseParams,
        dagId: null,
      });

      expect(result.dagId).toBeNull();
      expect(prisma.dagMetricsSettings.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveMetricsSettings", () => {
    const baseParams = {
      userId: "user-123",
      organizationId: "org-123",
    };

    it("should save valid metrics settings", async () => {
      const metrics: MetricConfig[] = [
        { id: "total_runs", type: MetricType.Builtin, enabled: true, order: 0 },
        { id: "success_rate", type: MetricType.Builtin, enabled: true, order: 1 },
      ];

      const savedSettings = {
        id: "settings-1",
        ...baseParams,
        dagId: "my_dag",
        selectedMetrics: metrics,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.dagMetricsSettings.upsert).mockResolvedValue(
        savedSettings as any
      );

      const result = await saveMetricsSettings({
        ...baseParams,
        dagId: "my_dag",
        selectedMetrics: metrics,
      });

      expect(result.selectedMetrics).toEqual(metrics);
      expect(prisma.dagMetricsSettings.upsert).toHaveBeenCalledWith({
        where: {
          userId_organizationId_dagId: {
            userId: "user-123",
            organizationId: "org-123",
            dagId: "my_dag",
          },
        },
        create: expect.objectContaining({
          userId: "user-123",
          organizationId: "org-123",
          dagId: "my_dag",
          selectedMetrics: metrics,
        }),
        update: {
          selectedMetrics: metrics,
        },
      });
    });

    it("should reject more than MAX_SELECTED_METRICS enabled metrics", async () => {
      const tooManyMetrics: MetricConfig[] = Array.from({ length: 10 }, (_, i) => ({
        id: `metric_${i}`,
        type: MetricType.Builtin,
        enabled: true,
        order: i,
      }));

      await expect(
        saveMetricsSettings({
          ...baseParams,
          dagId: "my_dag",
          selectedMetrics: tooManyMetrics,
        })
      ).rejects.toThrow(`Maximum ${MAX_SELECTED_METRICS} metrics can be enabled`);
    });

    it("should allow exactly MAX_SELECTED_METRICS enabled metrics", async () => {
      const maxMetrics: MetricConfig[] = Array.from(
        { length: MAX_SELECTED_METRICS },
        (_, i) => ({
          id: `metric_${i}`,
          type: MetricType.Builtin,
          enabled: true,
          order: i,
        })
      );

      vi.mocked(prisma.dagMetricsSettings.upsert).mockResolvedValue({
        id: "settings-1",
        ...baseParams,
        dagId: "my_dag",
        selectedMetrics: maxMetrics,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await saveMetricsSettings({
        ...baseParams,
        dagId: "my_dag",
        selectedMetrics: maxMetrics,
      });

      expect(result.selectedMetrics).toHaveLength(MAX_SELECTED_METRICS);
    });

    it("should save default settings when dagId is null", async () => {
      const metrics: MetricConfig[] = [
        { id: "total_runs", type: MetricType.Builtin, enabled: true, order: 0 },
      ];

      // For null dagId, we use findFirst + create (since no existing settings)
      vi.mocked(prisma.dagMetricsSettings.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.dagMetricsSettings.create).mockResolvedValue({
        id: "settings-default",
        ...baseParams,
        dagId: null,
        selectedMetrics: metrics,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await saveMetricsSettings({
        ...baseParams,
        dagId: null,
        selectedMetrics: metrics,
      });

      expect(prisma.dagMetricsSettings.findFirst).toHaveBeenCalledWith({
        where: { userId: "user-123", organizationId: "org-123", dagId: null },
      });
      expect(prisma.dagMetricsSettings.create).toHaveBeenCalled();
      expect(result.isDefault).toBe(true);
    });
  });

  describe("deleteMetricsSettings", () => {
    it("should delete DAG-specific settings", async () => {
      vi.mocked(prisma.dagMetricsSettings.delete).mockResolvedValue({} as any);

      await deleteMetricsSettings({
        userId: "user-123",
        organizationId: "org-123",
        dagId: "my_dag",
      });

      expect(prisma.dagMetricsSettings.delete).toHaveBeenCalledWith({
        where: {
          userId_organizationId_dagId: {
            userId: "user-123",
            organizationId: "org-123",
            dagId: "my_dag",
          },
        },
      });
    });

    it("should not throw if settings don't exist", async () => {
      vi.mocked(prisma.dagMetricsSettings.delete).mockRejectedValue(
        new Error("Record not found")
      );

      // Should not throw
      await expect(
        deleteMetricsSettings({
          userId: "user-123",
          organizationId: "org-123",
          dagId: "my_dag",
        })
      ).resolves.not.toThrow();
    });
  });
});
