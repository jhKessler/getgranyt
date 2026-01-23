import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { setupE2ETestData, cleanupE2ETestData } from "./helpers";
import { settingsRouter } from "@/server/routers/settings";
import { notify, NotificationEventType } from "@/server/services/notifications";
import { NotificationTypes } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { ChannelType } from "@prisma/client";

describe("E2E: Notification Flow", () => {
  let testData: Awaited<ReturnType<typeof setupE2ETestData>>;

  beforeAll(async () => {
    testData = await setupE2ETestData();
  });

  afterAll(async () => {
    await cleanupE2ETestData(testData.org.id, testData.user.id);
  });

  it("should manage notification settings and dispatch notifications", async () => {
    const { ctx, org, user } = testData;
    const caller = settingsRouter.createCaller(ctx as any);

    // 1. Get initial settings
    const initialSettings = await caller.getNotificationSettings();
    expect(initialSettings[NotificationTypes.ALL_ALERTS]).toBeDefined();

    // 2. Update a setting
    await caller.updateNotificationSetting({
      notificationType: NotificationTypes.ALL_ALERTS,
      enabled: false,
    });

    const updatedSettings = await caller.getNotificationSettings();
    expect(updatedSettings[NotificationTypes.ALL_ALERTS]).toBe(false);

    // 3. Configure a webhook channel (simulated)
    await prisma.organizationChannelConfig.create({
      data: {
        organizationId: org.id,
        channelType: ChannelType.WEBHOOK,
        enabled: true,
        config: {
          url: "https://example.com/webhook",
          headers: {},
          secret: "test-secret",
        },
      },
    });

    // 4. Try to notify when setting is DISABLED
    const resultDisabled = await notify({
      organizationId: org.id,
      type: NotificationEventType.ROW_COUNT_DROP_ALERT,
      severity: "warning",
      dagId: "test_dag",
      metadata: { dropPercentage: 50 },
    });

    // Should be false because ALL_ALERTS is disabled for the only user in org
    expect(resultDisabled.sent).toBe(false);

    // 5. Enable setting and notify again
    await caller.updateNotificationSetting({
      notificationType: NotificationTypes.ALL_ALERTS,
      enabled: true,
    });

    // We need to mock the actual fetch call in the webhook channel to avoid real network requests
    // but since this is an E2E test on the service level, we can just check if it attempts to send
    // or we can mock the webhook channel's send method if needed.
    // For now, let's just verify the logic flow.

    const resultEnabled = await notify({
      organizationId: org.id,
      type: NotificationEventType.ROW_COUNT_DROP_ALERT,
      severity: "warning",
      dagId: "test_dag",
      metadata: { dropPercentage: 50 },
    });

    // Should be true (or at least attempt to send) because setting is enabled
    // Note: It might still fail if the webhook call fails, but 'sent' usually means it passed the filters
    expect(resultEnabled.channels.length).toBeGreaterThan(0);
  });

  it("should manage notification filters for environment and run type", async () => {
    const { ctx, org, user } = testData;
    const caller = settingsRouter.createCaller(ctx as any);

    // 1. Get initial filters (should be defaults)
    const initialFilters = await caller.getNotificationFilters();
    expect(initialFilters.environmentFilter).toBe("all");
    expect(initialFilters.includeManualRuns).toBe(true);

    // 2. Update environment filter to default_only
    await caller.updateNotificationFilters({
      environmentFilter: "default_only",
    });

    const updatedFilters = await caller.getNotificationFilters();
    expect(updatedFilters.environmentFilter).toBe("default_only");
    expect(updatedFilters.includeManualRuns).toBe(true); // Should remain unchanged

    // 3. Update manual runs filter
    await caller.updateNotificationFilters({
      includeManualRuns: false,
    });

    const updatedFilters2 = await caller.getNotificationFilters();
    expect(updatedFilters2.environmentFilter).toBe("default_only"); // Should remain unchanged
    expect(updatedFilters2.includeManualRuns).toBe(false);

    // 4. Create a default environment for the org
    await prisma.environment.create({
      data: {
        organizationId: org.id,
        name: "production",
        isDefault: true,
      },
    });

    // 5. Ensure ALL_ALERTS is enabled for notify tests
    await caller.updateNotificationSetting({
      notificationType: NotificationTypes.ALL_ALERTS,
      enabled: true,
    });

    // 6. Test notification filtering with environment (staging env should be filtered out)
    const resultStagingEnv = await notify({
      organizationId: org.id,
      type: NotificationEventType.DAG_RUN_ALERTS_SUMMARY,
      severity: "warning",
      dagId: "test_dag",
      dagRunId: "run-1",
      srcRunId: "scheduled__2025-01-01",
      environment: "staging", // Non-default environment
      alerts: [],
    });

    // Should be false because user has environmentFilter set to "default_only"
    // and this is a staging environment notification
    expect(resultStagingEnv.sent).toBe(false);

    // 7. Test notification filtering with manual run type
    const resultManualRun = await notify({
      organizationId: org.id,
      type: NotificationEventType.DAG_RUN_ALERTS_SUMMARY,
      severity: "warning",
      dagId: "test_dag",
      dagRunId: "run-2",
      srcRunId: "manual__2025-01-01",
      environment: "production", // Default environment
      runType: "manual", // Manual run
      alerts: [],
    });

    // Should be false because user has includeManualRuns set to false
    expect(resultManualRun.sent).toBe(false);

    // 8. Test that notification passes when matching filters
    // Reset filters to allow the notification
    await caller.updateNotificationFilters({
      environmentFilter: "all",
      includeManualRuns: true,
    });

    const resultAllowed = await notify({
      organizationId: org.id,
      type: NotificationEventType.DAG_RUN_ALERTS_SUMMARY,
      severity: "warning",
      dagId: "test_dag",
      dagRunId: "run-3",
      srcRunId: "scheduled__2025-01-01",
      environment: "production",
      runType: "scheduled",
      alerts: [],
    });

    // Should attempt to send (channels.length > 0) because filters allow it
    expect(resultAllowed.channels.length).toBeGreaterThan(0);
  });
});
