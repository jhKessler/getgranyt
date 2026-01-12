"use client"

import { createContext, useContext, ReactNode } from "react"
import { useSettingsPage } from "../_hooks"

type SettingsContextType = ReturnType<typeof useSettingsPage>

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSettingsPage()
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider")
  }
  return context
}

export function useChannelManagement() {
  const settings = useSettings()
  return {
    channelStatuses: settings.channelStatuses,
    getChannelConfig: settings.getChannelConfig,
    toggleChannel: settings.handleToggleChannel,
    saveConfig: settings.handleSaveChannelConfig,
    testConnection: settings.handleTestChannelConnection,
    sendTest: settings.handleSendTestNotification,
    clearConfig: settings.handleClearChannelConfig,
    isToggling: settings.isTogglingChannel,
    isSaving: settings.isSavingChannelConfig,
    isTesting: settings.isTestingChannelConnection,
    isSendingTest: settings.isSendingTestNotification,
  }
}
