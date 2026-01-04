"use client";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useSettingsPage() {
  const utils = trpc.useUtils();
  
  // Queries
  const { data: notificationSettings, isLoading: isLoadingNotifications } = trpc.settings.getNotificationSettings.useQuery();
  
  // Mutations
  const updateNotifications = trpc.settings.updateNotificationSettings.useMutation({
    onSuccess: () => {
      toast.success("Notification settings updated");
      utils.settings.getNotificationSettings.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
  
  // Handlers
  const handleUpdateNotifications = (updates: Array<{ type: string; enabled: boolean }>) => {
    updateNotifications.mutate(
      updates.map((u) => ({
        notificationType: u.type as Parameters<typeof updateNotifications.mutate>[0][number]["notificationType"],
        enabled: u.enabled,
      }))
    );
  };

  const handleToggleNotification = (type: string, enabled: boolean) => {
    handleUpdateNotifications([{ type, enabled }]);
  };
  
  // ============================================================================
  // CHANNEL MANAGEMENT
  // ============================================================================

  const { data: channelStatuses, isLoading: isLoadingChannels } = 
    trpc.settings.getChannelStatuses.useQuery({});

  const toggleChannel = trpc.settings.toggleChannel.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`${variables.channelType} channel ${variables.enabled ? "enabled" : "disabled"}`);
      utils.settings.getChannelStatuses.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to toggle channel: ${error.message}`);
    },
  });

  const saveChannelConfig = trpc.settings.saveChannelConfig.useMutation({
    onSuccess: () => {
      toast.success("Channel settings saved");
      utils.settings.getChannelStatuses.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to save channel config: ${error.message}`);
    },
  });

  const testChannelConnection = trpc.settings.testChannelConnection.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Connection successful!");
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
      utils.settings.getChannelStatuses.invalidate();
    },
    onError: (error) => {
      toast.error(`Test failed: ${error.message}`);
    },
  });

  const sendTestNotification = trpc.settings.sendTestNotification.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Test notification sent!");
      } else {
        toast.error(`Failed to send: ${result.error}`);
      }
      utils.settings.getChannelStatuses.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  const clearChannelConfig = trpc.settings.clearChannelConfig.useMutation({
    onSuccess: () => {
      toast.success("Channel configuration cleared");
      utils.settings.getChannelStatuses.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to clear config: ${error.message}`);
    },
  });

  // Channel config queries (lazy - only fetch when needed)
  
  const smtpConfigQuery = trpc.settings.getChannelConfig.useQuery(
    { channelType: "SMTP" as const },
    { enabled: !!channelStatuses }
  );
  const resendConfigQuery = trpc.settings.getChannelConfig.useQuery(
    { channelType: "RESEND" as const },
    { enabled: !!channelStatuses }
  );
  const webhookConfigQuery = trpc.settings.getChannelConfig.useQuery(
    { channelType: "WEBHOOK" as const },
    { enabled: !!channelStatuses }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getChannelConfig = (channelType: string): any => {
    switch (channelType) {
      case "SMTP":
        return smtpConfigQuery.data;
      case "RESEND":
        return resendConfigQuery.data;
      case "WEBHOOK":
        return webhookConfigQuery.data;
      default:
        return undefined;
    }
  };

  const handleToggleChannel = (channelType: string, enabled: boolean) => {
    toggleChannel.mutate({
      channelType: channelType as "SMTP" | "RESEND" | "WEBHOOK",
      enabled,
    });
  };

  const handleSaveChannelConfig = (
    channelType: string,
    enabled: boolean,
    config: Record<string, unknown> | null
  ) => {
    saveChannelConfig.mutate({
      channelType: channelType as "SMTP" | "RESEND" | "WEBHOOK",
      enabled,
      config,
    });
  };

  const handleTestChannelConnection = (channelType: string) => {
    testChannelConnection.mutate({
      channelType: channelType as "SMTP" | "RESEND" | "WEBHOOK",
    });
  };

  const handleSendTestNotification = (channelType: string, recipient: string) => {
    sendTestNotification.mutate({
      channelType: channelType as "SMTP" | "RESEND" | "WEBHOOK",
      testRecipient: recipient,
    });
  };

  const handleClearChannelConfig = (channelType: string) => {
    clearChannelConfig.mutate({
      channelType: channelType as "SMTP" | "RESEND" | "WEBHOOK",
    });
  };
  
  return {
    // Loading states
    isLoading: isLoadingNotifications || isLoadingChannels,
    
    // Data
    notificationSettings,
    
    // Handlers
    handleUpdateNotifications,
    handleToggleNotification,

    // Channel Management
    channelStatuses,
    getChannelConfig,
    handleToggleChannel,
    handleSaveChannelConfig,
    handleTestChannelConnection,
    handleSendTestNotification,
    handleClearChannelConfig,
    isTogglingChannel: toggleChannel.isPending,
    isSavingChannelConfig: saveChannelConfig.isPending,
    isTestingChannelConnection: testChannelConnection.isPending,
    isSendingTestNotification: sendTestNotification.isPending,
  };
}
