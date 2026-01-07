"use client";

import { PageHeader, PageSkeleton, GettingStartedChecklist } from "@/components/shared";
import { useSettingsPage } from "../_hooks";
import {
  NotificationPreferencesCard,
  EmailSetupCard,
  NotificationSettingsCard,
  AirflowSettingsCard,
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
  // Airflow settings
  airflowSettings,
  handleSaveAirflowUrl,
  isSavingAirflowSettings,
  // Setup status
  setupStatus,
  isLoadingSetupStatus,
}: ReturnType<typeof useSettingsPage>) {
  if (isLoading) {
    return <PageSkeleton rows={3} />;
  }

  // Check if any email channel (SMTP or RESEND) is configured and enabled
  const hasEmailConfigured = channelStatuses?.some(
    (channel) =>
      (channel.type === "SMTP" || channel.type === "RESEND") &&
      channel.isConfigured &&
      channel.isEnabled
  ) ?? false;

  // Check if all setup steps are complete
  const isSetupComplete = setupStatus?.hasDagRuns && 
    setupStatus?.hasNotificationChannel && 
    setupStatus?.hasErrors;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure notification channels and alert preferences"
      />

      <div className="grid gap-6">
        {/* Getting Started Checklist - show if not all complete */}
        {!isSetupComplete && (
          <GettingStartedChecklist
            setupStatus={setupStatus}
            isLoading={isLoadingSetupStatus}
          />
        )}

        <AirflowSettingsCard
          airflowUrl={airflowSettings?.airflowUrl}
          onSave={handleSaveAirflowUrl}
          isSaving={isSavingAirflowSettings}
        />

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
          hasEmailConfigured={hasEmailConfigured}
        />
      </div>
    </div>
  );
}
