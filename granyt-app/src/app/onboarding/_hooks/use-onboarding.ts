"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import {
  getNotificationDefaults,
  ERROR_NOTIFICATIONS,
  isSelectSetting,
  type NotificationTypeValue,
} from "@/lib/notifications"

export function useOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState("")
  const [airflowUrl, setAirflowUrl] = useState("")
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Notification preferences state
  const [notificationSettings, setNotificationSettings] = useState<
    Record<NotificationTypeValue, boolean>
  >(getNotificationDefaults)

  // Query email configuration status
  const { data: emailStatus } = trpc.settings.getEmailEnvStatus.useQuery()

  // Mutation for saving notification settings
  const updateNotifications = trpc.settings.updateNotificationSettings.useMutation({
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to save notification settings")
    },
  })

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: (data: { id: string }) => {
      setOrganizationId(data.id)
      setStep(2) // Move to email setup step
      toast.success("Organization created!")
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create organization")
    },
  })

  const generateKey = trpc.organization.generateApiKey.useMutation({
    onSuccess: (data: { key: string }) => {
      setApiKey(data.key)
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to generate API key")
    },
  })

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationName.trim()) {
      toast.error("Please enter an organization name")
      return
    }
    createOrg.mutate({ 
      name: organizationName.trim(),
      airflowUrl: airflowUrl.trim() || undefined,
    })
  }

  const handleEmailStepContinue = () => {
    // Move to notification preferences step
    setStep(3)
  }

  const handleEmailStepSkip = () => {
    // Same as continue - move to notification preferences step
    handleEmailStepContinue()
  }

  // Notification settings handlers
  const handleNotificationSettingChange = (type: NotificationTypeValue, enabled: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [type]: enabled }))
  }

  const getErrorSelectValue = () => {
    const errorSetting = ERROR_NOTIFICATIONS[0]
    if (errorSetting && isSelectSetting(errorSetting)) {
      return errorSetting.fromSettings(notificationSettings as Record<string, boolean>)
    }
    return "disabled"
  }

  const handleErrorSelectChange = (value: string) => {
    const errorSetting = ERROR_NOTIFICATIONS[0]
    if (errorSetting && isSelectSetting(errorSetting)) {
      const updates = errorSetting.toSettingsUpdate(value)
      setNotificationSettings((prev) => {
        const newSettings = { ...prev }
        for (const update of updates) {
          newSettings[update.type] = update.enabled
        }
        return newSettings
      })
    }
  }

  const handleSaveNotifications = async () => {
    // Convert settings to array format for batch update
    const settings = Object.entries(notificationSettings).map(([notificationType, enabled]) => ({
      notificationType: notificationType as NotificationTypeValue,
      enabled,
    }))

    await updateNotifications.mutateAsync(settings)
    toast.success("Notification preferences saved!")
    
    // Move to API key step and generate key
    setStep(4)
    if (organizationId) {
      generateKey.mutate({
        organizationId,
        name: "Default Key",
        type: "sdk",
      })
    }
  }

  const handleSkipNotifications = () => {
    // Skip without saving - use defaults, move to API key step
    setStep(4)
    if (organizationId) {
      generateKey.mutate({
        organizationId,
        name: "Default Key",
        type: "sdk",
      })
    }
  }

  const handleCopyApiKey = async () => {
    if (!apiKey) return
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    toast.success("API key copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFinish = () => {
    router.push("/dashboard/settings")
    router.refresh()
  }

  const goToStep = (newStep: number) => setStep(newStep)

  const isLoading = createOrg.isPending || generateKey.isPending
  const isNotificationLoading = updateNotifications.isPending

  return {
    step,
    goToStep,
    organizationName,
    setOrganizationName,
    airflowUrl,
    setAirflowUrl,
    apiKey,
    copied,
    isLoading,
    isNotificationLoading,
    isEmailConfigured: emailStatus?.isEmailConfigured ?? false,
    // Notification settings
    notificationSettings,
    errorSelectValue: getErrorSelectValue(),
    handleNotificationSettingChange,
    handleErrorSelectChange,
    handleSaveNotifications,
    handleSkipNotifications,
    // Other handlers
    handleCreateOrg,
    handleEmailStepContinue,
    handleEmailStepSkip,
    handleCopyApiKey,
    handleFinish,
  }
}
