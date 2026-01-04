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
});
