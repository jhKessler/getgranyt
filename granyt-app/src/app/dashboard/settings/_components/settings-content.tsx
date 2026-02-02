"use client";

import { PageHeader, PageSkeleton, GettingStartedChecklist } from "@/components/shared";
import { useSettings } from "../_context";
import { useSession } from "@/lib/auth-client";
import {
  OrgEmailSettingsCard,
  NotificationPreferencesCard,
  AirflowSettingsCard,
  TeamSettingsCard,
} from ".";

export function SettingsContent() {
  const { data: session } = useSession();
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
    canManageTeam,
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

  const currentUserId = session?.user?.id ?? "";

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

        {canManageTeam && <TeamSettingsCard currentUserId={currentUserId} />}

        <AirflowSettingsCard
          environments={airflowEnvironments}
          onSave={handleSaveEnvironmentAirflowUrl}
          isSaving={isSavingAirflowSettings}
          savingEnvironmentId={savingEnvironmentId}
        />

        <OrgEmailSettingsCard />

        <NotificationPreferencesCard
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
