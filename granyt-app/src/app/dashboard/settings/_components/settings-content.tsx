"use client";

import { PageHeader, PageSkeleton } from "@/components/shared";
import { useSettingsPage } from "../_hooks";
import {
  NotificationPreferencesCard,
  EmailSetupCard,
  NotificationSettingsCard,
} from ".";

export function SettingsContent({
  isLoading,
  notificationSettings,
  handleUpdateNotifications,
  // Channel management
  channelStatuses,
  getChannelConfig,
  handleToggleChannel,
  handleSaveChannelConfig,
  handleTestChannelConnection,
  handleSendTestNotification,
  handleClearChannelConfig,
  isTogglingChannel,
  isSavingChannelConfig,
  isTestingChannelConnection,
  isSendingTestNotification,
}: ReturnType<typeof useSettingsPage>) {
  if (isLoading) {
    return <PageSkeleton rows={3} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure notification channels and alert preferences"
      />

      <div className="grid gap-6">
        <EmailSetupCard
          channelStatuses={channelStatuses}
          onToggleChannel={handleToggleChannel}
          onSaveConfig={handleSaveChannelConfig}
          onTestConnection={handleTestChannelConnection}
          onSendTest={handleSendTestNotification}
          onClearConfig={handleClearChannelConfig}
          getChannelConfig={getChannelConfig}
          isTogglingChannel={isTogglingChannel}
          isSavingConfig={isSavingChannelConfig}
          isTestingConnection={isTestingChannelConnection}
          isSendingTest={isSendingTestNotification}
        />

        <NotificationSettingsCard
          channelStatuses={channelStatuses}
          onToggleChannel={handleToggleChannel}
          onSaveConfig={handleSaveChannelConfig}
          onTestConnection={handleTestChannelConnection}
          onSendTest={handleSendTestNotification}
          onClearConfig={handleClearChannelConfig}
          getChannelConfig={getChannelConfig}
          isTogglingChannel={isTogglingChannel}
          isSavingConfig={isSavingChannelConfig}
          isTestingConnection={isTestingChannelConnection}
          isSendingTest={isSendingTestNotification}
        />

        <NotificationPreferencesCard
          settings={notificationSettings}
          onUpdate={handleUpdateNotifications}
        />
      </div>
    </div>
  );
}
