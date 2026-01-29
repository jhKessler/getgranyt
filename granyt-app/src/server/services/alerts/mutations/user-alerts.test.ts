import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertType, AlertStatus } from "@prisma/client";
import { createUserAlert } from "./user-alerts";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    alert: {
      create: vi.fn(),
    },
    dagRun: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock notify
vi.mock("@/server/services/notifications", () => ({
  notify: vi.fn().mockResolvedValue({ sent: true, channels: [] }),
  NotificationEventType: {
    USER_CREATED_ALERT: "USER_CREATED_ALERT",
  },
}));

// Mock env
vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://app.granyt.io",
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  }),
}));

import { prisma } from "@/lib/prisma";
import { notify } from "@/server/services/notifications";

describe("createUserAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseParams = {
    organizationId: "org-1",
    srcDagId: "test_dag",
    dagRunId: "run-1",
    taskRunId: "task-1",
    title: "Test Alert",
    sendNotification: false,
    environment: "production",
  };

  it("creates alert with USER_CREATED type", async () => {
    const mockAlert = {
      id: "alert-1",
      organizationId: "org-1",
      alertType: AlertType.USER_CREATED,
      status: AlertStatus.OPEN,
      severity: "warning",
      srcDagId: "test_dag",
      captureId: "user-alert:task-1",
      dagRunId: "run-1",
      taskRunId: "task-1",
      metadata: { title: "Test Alert", description: null, createdVia: "xcom" },
      createdAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      dismissedAt: null,
      dismissedBy: null,
      dismissReason: null,
    };

    vi.mocked(prisma.alert.create).mockResolvedValue(mockAlert);

    const result = await createUserAlert(baseParams);

    expect(prisma.alert.create).toHaveBeenCalledWith({
      data: {
        organizationId: "org-1",
        alertType: AlertType.USER_CREATED,
        status: AlertStatus.OPEN,
        severity: "warning",
        srcDagId: "test_dag",
        captureId: "user-alert:task-1",
        dagRunId: "run-1",
        taskRunId: "task-1",
        metadata: {
          title: "Test Alert",
          description: null,
          createdVia: "xcom",
        },
      },
    });

    expect(result.alertType).toBe(AlertType.USER_CREATED);
  });

  it("stores title and description in metadata", async () => {
    const mockAlert = {
      id: "alert-1",
      organizationId: "org-1",
      alertType: AlertType.USER_CREATED,
      status: AlertStatus.OPEN,
      severity: "warning",
      srcDagId: "test_dag",
      captureId: "user-alert:task-1",
      dagRunId: "run-1",
      taskRunId: "task-1",
      metadata: {
        title: "Test Alert",
        description: "This is a test description",
        createdVia: "xcom",
      },
      createdAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      dismissedAt: null,
      dismissedBy: null,
      dismissReason: null,
    };

    vi.mocked(prisma.alert.create).mockResolvedValue(mockAlert);

    await createUserAlert({
      ...baseParams,
      description: "This is a test description",
    });

    expect(prisma.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: {
          title: "Test Alert",
          description: "This is a test description",
          createdVia: "xcom",
        },
      }),
    });
  });

  it("sends notification when sendNotification is true", async () => {
    const mockAlert = {
      id: "alert-1",
      organizationId: "org-1",
      alertType: AlertType.USER_CREATED,
      status: AlertStatus.OPEN,
      severity: "warning",
      srcDagId: "test_dag",
      captureId: "user-alert:task-1",
      dagRunId: "run-1",
      taskRunId: "task-1",
      metadata: { title: "Test Alert", description: null, createdVia: "xcom" },
      createdAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      dismissedAt: null,
      dismissedBy: null,
      dismissReason: null,
    };

    vi.mocked(prisma.alert.create).mockResolvedValue(mockAlert);
    vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({
      id: "run-1",
      srcRunId: "manual__2025-01-01",
      runType: "manual",
    } as never);

    await createUserAlert({
      ...baseParams,
      sendNotification: true,
      description: "Alert description",
    });

    expect(notify).toHaveBeenCalledWith({
      organizationId: "org-1",
      type: "USER_CREATED_ALERT",
      severity: "warning",
      dagId: "test_dag",
      alertId: "alert-1",
      title: "Test Alert",
      description: "Alert description",
      environment: "production",
      runType: "manual",
      dashboardUrl: "https://app.granyt.io/dashboard/dags/test_dag/alerts",
    });
  });

  it("does not send notification when sendNotification is false", async () => {
    const mockAlert = {
      id: "alert-1",
      organizationId: "org-1",
      alertType: AlertType.USER_CREATED,
      status: AlertStatus.OPEN,
      severity: "warning",
      srcDagId: "test_dag",
      captureId: "user-alert:task-1",
      dagRunId: "run-1",
      taskRunId: "task-1",
      metadata: { title: "Test Alert", description: null, createdVia: "xcom" },
      createdAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      dismissedAt: null,
      dismissedBy: null,
      dismissReason: null,
    };

    vi.mocked(prisma.alert.create).mockResolvedValue(mockAlert);

    await createUserAlert({
      ...baseParams,
      sendNotification: false,
    });

    expect(notify).not.toHaveBeenCalled();
  });

  it("handles missing description", async () => {
    const mockAlert = {
      id: "alert-1",
      organizationId: "org-1",
      alertType: AlertType.USER_CREATED,
      status: AlertStatus.OPEN,
      severity: "warning",
      srcDagId: "test_dag",
      captureId: "user-alert:task-1",
      dagRunId: "run-1",
      taskRunId: "task-1",
      metadata: { title: "Test Alert", description: null, createdVia: "xcom" },
      createdAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      dismissedAt: null,
      dismissedBy: null,
      dismissReason: null,
    };

    vi.mocked(prisma.alert.create).mockResolvedValue(mockAlert);

    const { description: _removed, ...paramsWithoutDescription } = baseParams;
    await createUserAlert(paramsWithoutDescription as typeof baseParams);

    expect(prisma.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          description: null,
        }),
      }),
    });
  });

  it("handles missing environment", async () => {
    const mockAlert = {
      id: "alert-1",
      organizationId: "org-1",
      alertType: AlertType.USER_CREATED,
      status: AlertStatus.OPEN,
      severity: "warning",
      srcDagId: "test_dag",
      captureId: "user-alert:task-1",
      dagRunId: "run-1",
      taskRunId: "task-1",
      metadata: { title: "Test Alert", description: null, createdVia: "xcom" },
      createdAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      dismissedAt: null,
      dismissedBy: null,
      dismissReason: null,
    };

    vi.mocked(prisma.alert.create).mockResolvedValue(mockAlert);
    vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({
      id: "run-1",
      srcRunId: null,
      runType: null,
    } as never);

    const { environment: _removed, ...paramsWithoutEnv } = baseParams;
    await createUserAlert({
      ...paramsWithoutEnv,
      sendNotification: true,
    } as typeof baseParams);

    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: undefined,
      })
    );
  });
});
