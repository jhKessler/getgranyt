import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertType, AlertSensitivity } from "@prisma/client";
import { getEffectiveSettings, reduceDagSensitivity } from "./get-effective-settings";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    organizationAlertSettings: {
      findUnique: vi.fn(),
    },
    dagAlertSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Get Effective Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default settings when no org or DAG settings exist", async () => {
    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue(null);

    const result = await getEffectiveSettings(
      "org-1",
      "test_dag",
      "capture_1",
      AlertType.ROW_COUNT_DROP
    );

    expect(result.enabled).toBe(true);
    expect(result.sensitivity).toBe(AlertSensitivity.MEDIUM);
  });

  it("should use organization settings when no DAG settings exist", async () => {
    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue({
      id: "org-settings-1",
      organizationId: "org-1",
      alertType: AlertType.ROW_COUNT_DROP,
      enabled: true,
      sensitivity: AlertSensitivity.HIGH,
      customThreshold: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getEffectiveSettings(
      "org-1",
      "test_dag",
      "capture_1",
      AlertType.ROW_COUNT_DROP
    );

    expect(result.sensitivity).toBe(AlertSensitivity.HIGH);
  });

  it("should use DAG settings when they exist", async () => {
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue({
      id: "org-settings-1",
      organizationId: "org-1",
      alertType: AlertType.ROW_COUNT_DROP,
      enabled: true,
      sensitivity: AlertSensitivity.HIGH,
      customThreshold: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue({
      id: "dag-settings-1",
      organizationId: "org-1",
      srcDagId: "test_dag",
      captureId: "capture_1",
      alertType: AlertType.ROW_COUNT_DROP,
      enabled: false,
      sensitivity: AlertSensitivity.LOW,
      customThreshold: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getEffectiveSettings(
      "org-1",
      "test_dag",
      "capture_1",
      AlertType.ROW_COUNT_DROP
    );

    expect(result.enabled).toBe(false);
    expect(result.sensitivity).toBe(AlertSensitivity.LOW);
  });

  it("should inherit from org when DAG setting is null", async () => {
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue({
      id: "org-settings-1",
      organizationId: "org-1",
      alertType: AlertType.ROW_COUNT_DROP,
      enabled: true,
      sensitivity: AlertSensitivity.HIGH,
      customThreshold: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue({
      id: "dag-settings-1",
      organizationId: "org-1",
      srcDagId: "test_dag",
      captureId: "capture_1",
      alertType: AlertType.ROW_COUNT_DROP,
      enabled: null, // Inherit from org
      sensitivity: null, // Inherit from org
      customThreshold: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getEffectiveSettings(
      "org-1",
      "test_dag",
      "capture_1",
      AlertType.ROW_COUNT_DROP
    );

    // Should inherit from org
    expect(result.enabled).toBe(true);
    expect(result.sensitivity).toBe(AlertSensitivity.HIGH);
  });
});

describe("Reduce DAG Sensitivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reduce HIGH to MEDIUM", async () => {
    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue({
      id: "org-1",
      organizationId: "org-1",
      alertType: AlertType.ROW_COUNT_DROP,
      enabled: true,
      sensitivity: AlertSensitivity.HIGH,
      customThreshold: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.dagAlertSettings.upsert).mockResolvedValue({} as never);

    await reduceDagSensitivity(
      "org-1",
      "test_dag",
      "capture_1",
      AlertType.ROW_COUNT_DROP
    );

    expect(prisma.dagAlertSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sensitivity: AlertSensitivity.MEDIUM,
        }),
        update: expect.objectContaining({
          sensitivity: AlertSensitivity.MEDIUM,
        }),
      })
    );
  });

  it("should reduce MEDIUM to LOW", async () => {
    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue(null);
    // Default is MEDIUM
    vi.mocked(prisma.dagAlertSettings.upsert).mockResolvedValue({} as never);

    await reduceDagSensitivity(
      "org-1",
      "test_dag",
      "capture_1",
      AlertType.ROW_COUNT_DROP
    );

    expect(prisma.dagAlertSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sensitivity: AlertSensitivity.LOW,
        }),
      })
    );
  });

  it("should reduce LOW to DISABLED", async () => {
    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue({
      id: "dag-1",
      organizationId: "org-1",
      srcDagId: "test_dag",
      captureId: "capture_1",
      alertType: AlertType.ROW_COUNT_DROP,
      enabled: true,
      sensitivity: AlertSensitivity.LOW,
      customThreshold: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.dagAlertSettings.upsert).mockResolvedValue({} as never);

    await reduceDagSensitivity(
      "org-1",
      "test_dag",
      "capture_1",
      AlertType.ROW_COUNT_DROP
    );

    expect(prisma.dagAlertSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sensitivity: AlertSensitivity.DISABLED,
        }),
      })
    );
  });
});

describe("enabledEnvironments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array (all envs) by default when no settings exist", async () => {
    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue(null);

    const result = await getEffectiveSettings(
      "org-1",
      "test_dag",
      "capture_1",
      AlertType.ROW_COUNT_DROP
    );

    expect(result.enabledEnvironments).toEqual([]);
  });

  it("should return org-level enabledEnvironments when set", async () => {
    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue({
      id: "org-settings-1",
      organizationId: "org-1",
      alertType: AlertType.ROW_COUNT_DROP,
      enabled: true,
      sensitivity: AlertSensitivity.MEDIUM,
      customThreshold: null,
      enabledEnvironments: ["production", "staging"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getEffectiveSettings(
      "org-1",
      "test_dag",
      "capture_1",
      AlertType.ROW_COUNT_DROP
    );

    expect(result.enabledEnvironments).toEqual(["production", "staging"]);
  });

  it("should use org enabledEnvironments even when DAG settings exist", async () => {
    vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue({
      id: "org-settings-1",
      organizationId: "org-1",
      alertType: AlertType.ROW_COUNT_DROP,
      enabled: true,
      sensitivity: AlertSensitivity.MEDIUM,
      customThreshold: null,
      enabledEnvironments: ["production"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // DAG settings exist but don't have enabledEnvironments (org-level only)
    vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue({
      id: "dag-settings-1",
      organizationId: "org-1",
      srcDagId: "test_dag",
      captureId: "capture_1",
      alertType: AlertType.ROW_COUNT_DROP,
      enabled: true,
      sensitivity: AlertSensitivity.HIGH, // DAG overrides sensitivity
      customThreshold: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getEffectiveSettings(
      "org-1",
      "test_dag",
      "capture_1",
      AlertType.ROW_COUNT_DROP
    );

    // enabledEnvironments comes from org (not overridden by DAG)
    expect(result.enabledEnvironments).toEqual(["production"]);
    // But sensitivity is overridden by DAG
    expect(result.sensitivity).toBe(AlertSensitivity.HIGH);
  });
});
