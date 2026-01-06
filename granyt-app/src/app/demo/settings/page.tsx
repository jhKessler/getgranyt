"use client"

import { SettingsContent } from "../../dashboard/settings/_components"

export default function DemoSettingsPage() {
  return (
    <SettingsContent
      isLoading={false}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notificationSettings={{} as any}
      handleUpdateNotifications={async () => {}}
      handleToggleNotification={() => {}}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channelStatuses={[] as any}
      getChannelConfig={() => ({})}
      handleToggleChannel={async () => {}}
      handleSaveChannelConfig={async () => {}}
      handleTestChannelConnection={async () => ({ success: true })}
      handleSendTestNotification={async () => ({ success: true })}
      handleClearChannelConfig={async () => {}}
      isTogglingChannel={false}
      isSavingChannelConfig={false}
      isTestingChannelConnection={false}
      isSendingTestNotification={false}
      airflowSettings={{ airflowUrl: null }}
      handleSaveAirflowUrl={() => {}}
      isSavingAirflowSettings={false}
    />
  )
}
