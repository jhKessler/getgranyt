"use client";

import { PageHeader, PageSkeleton, GettingStartedChecklist } from "@/components/shared";
import { useSettings } from "../_context";
import {
  EmailSettingsCard,
  AirflowSettingsCard,
} from ".";

export function SettingsContent() {
  const {
    isLoading,
    notificationSettings,
    handleUpdateNotifications,
    notificationFilters,
    handleUpdateFilters,
    isUpdatingFilters,
    defaultEnvironmentName,
    channelStatuses,
    airflowEnvironments,
    handleSaveEnvironmentAirflowUrl,
    isSavingAirflowSettings,
    savingEnvironmentId,
    setupStatus,
    isLoadingSetupStatus,
  } = useSettings();

  if (isLoading) {
    return <PageSkeleton rows={3} />;
  }

  const hasEmailConfigured = channelStatuses?.some(
    (channel) =>
      (channel.type === "SMTP" || channel.type === "RESEND") &&
      channel.isConfigured &&
      channel.isEnabled
  ) ?? false;

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
        {!isSetupComplete && (
          <GettingStartedChecklist
            setupStatus={setupStatus}
            isLoading={isLoadingSetupStatus}
          />
        )}

        <AirflowSettingsCard
          environments={airflowEnvironments}
          onSave={handleSaveEnvironmentAirflowUrl}
          isSaving={isSavingAirflowSettings}
          savingEnvironmentId={savingEnvironmentId}
        />

        <EmailSettingsCard
          notificationSettings={notificationSettings}
          onUpdateNotifications={handleUpdateNotifications}
          filters={notificationFilters}
          onUpdateFilters={handleUpdateFilters}
          hasEmailConfigured={hasEmailConfigured}
          defaultEnvironmentName={defaultEnvironmentName}
          isUpdatingFilters={isUpdatingFilters}
        />
      </div>
    </div>
  );
}
