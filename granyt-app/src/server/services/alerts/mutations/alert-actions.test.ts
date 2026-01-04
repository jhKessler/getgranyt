import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertType, AlertStatus } from "@prisma/client";
import { acknowledgeAlert, dismissAlert, reopenAlert } from "./alert-actions";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    alert: {
      update: vi.fn(),
    },
    dagAlertSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    organizationAlertSettings: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Alert Mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("acknowledgeAlert", () => {
    it("should update alert status to ACKNOWLEDGED", async () => {
      vi.mocked(prisma.alert.update).mockResolvedValue({} as never);

      await acknowledgeAlert("alert-1", "user-1");

      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: "alert-1" },
        data: expect.objectContaining({
          status: AlertStatus.ACKNOWLEDGED,
          acknowledgedBy: "user-1",
        }),
      });
    });
  });

  describe("dismissAlert", () => {
    it("should update alert status to DISMISSED", async () => {
      vi.mocked(prisma.alert.update).mockResolvedValue({
        id: "alert-1",
        organizationId: "org-1",
        alertType: AlertType.ROW_COUNT_DROP,
        status: AlertStatus.DISMISSED,
        severity: "warning",
        srcDagId: "test_dag",
        captureId: "capture_1",
        dagRunId: "run-1",
        taskRunId: "task-1",
        metadata: {},
        acknowledgedAt: null,
        acknowledgedBy: null,
        dismissedAt: new Date(),
        dismissedBy: "user-1",
        dismissReason: "one_time",
        createdAt: new Date(),
      });

      await dismissAlert("alert-1", "user-1", "one_time");

      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: "alert-1" },
        data: expect.objectContaining({
          status: AlertStatus.DISMISSED,
          dismissedBy: "user-1",
          dismissReason: "one_time",
        }),
      });
    });

    it("should reduce sensitivity when reason is expected_behavior", async () => {
      vi.mocked(prisma.alert.update).mockResolvedValue({
        id: "alert-1",
        organizationId: "org-1",
        alertType: AlertType.ROW_COUNT_DROP,
        status: AlertStatus.DISMISSED,
        severity: "warning",
        srcDagId: "test_dag",
        captureId: "capture_1",
        dagRunId: "run-1",
        taskRunId: "task-1",
        metadata: {},
        acknowledgedAt: null,
        acknowledgedBy: null,
        dismissedAt: new Date(),
        dismissedBy: "user-1",
        dismissReason: "expected_behavior",
        createdAt: new Date(),
      });
      vi.mocked(prisma.dagAlertSettings.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.organizationAlertSettings.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagAlertSettings.upsert).mockResolvedValue({} as never);

      await dismissAlert("alert-1", "user-1", "expected_behavior");

      // Should have called reduceDagSensitivity
      expect(prisma.dagAlertSettings.upsert).toHaveBeenCalled();
    });

    it("should NOT reduce sensitivity when reason is one_time", async () => {
      vi.mocked(prisma.alert.update).mockResolvedValue({
        id: "alert-1",
        organizationId: "org-1",
        alertType: AlertType.ROW_COUNT_DROP,
        status: AlertStatus.DISMISSED,
        severity: "warning",
        srcDagId: "test_dag",
        captureId: "capture_1",
        dagRunId: "run-1",
        taskRunId: "task-1",
        metadata: {},
        acknowledgedAt: null,
        acknowledgedBy: null,
        dismissedAt: new Date(),
        dismissedBy: "user-1",
        dismissReason: "one_time",
        createdAt: new Date(),
      });

      await dismissAlert("alert-1", "user-1", "one_time");

      // Should NOT have called reduceDagSensitivity
      expect(prisma.dagAlertSettings.upsert).not.toHaveBeenCalled();
    });
  });

  describe("reopenAlert", () => {
    it("should reset alert to OPEN status", async () => {
      vi.mocked(prisma.alert.update).mockResolvedValue({} as never);

      await reopenAlert("alert-1");

      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: "alert-1" },
        data: {
          status: AlertStatus.OPEN,
          acknowledgedAt: null,
          acknowledgedBy: null,
          dismissedAt: null,
          dismissedBy: null,
          dismissReason: null,
        },
      });
    });
  });
});
