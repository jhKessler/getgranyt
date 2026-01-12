"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import {
  getNotificationDefaults,
  ERROR_NOTIFICATIONS,
  isSelectSetting,
  type NotificationTypeValue,
} from "@/lib/notifications"
import { getGranytMode } from "@/lib/utils"

export function useOnboarding() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [step, setStep] = useState(1)

  // Check if user has already completed onboarding (has an organization)
  const { data: organizations, isLoading: isOrgsLoading } = trpc.organization.list.useQuery()

  // Redirect if onboarding is already completed (not in DEV mode)
  useEffect(() => {
    if (isOrgsLoading) return
    
    const hasCompletedOnboarding = organizations && organizations.length > 0
    const isDevMode = getGranytMode() === "DEV"
    
    if (hasCompletedOnboarding && !isDevMode) {
      router.replace("/dashboard")
    }
  }, [organizations, isOrgsLoading, router])
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState("")
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Notification preferences state
  const [notificationSettings, setNotificationSettings] = useState<
    Record<NotificationTypeValue, boolean>
  >(getNotificationDefaults)

  // Query email configuration status
  const { data: emailStatus, refetch: refetchEmailStatus } = trpc.settings.getEmailEnvStatus.useQuery()

  // Mutation for saving notification settings
  const updateNotifications = trpc.settings.updateNotificationSettings.useMutation({
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to save notification settings")
    },
  })

  // Mutation for saving email channel config
  const saveChannelConfig = trpc.settings.saveChannelConfig.useMutation({
    onSuccess: () => {
      toast.success("Email configuration saved!")
      refetchEmailStatus()
      utils.settings.getChannelStatuses.invalidate()
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to save email configuration")
    },
  })

  // Get user session for email and authentication check
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const userEmail = session?.user?.email ?? undefined

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isSessionPending && !session) {
      router.replace("/login")
    }
  }, [session, isSessionPending, router])

  // Mutation for sending test email
  const sendTestEmail = trpc.settings.sendTestNotification.useMutation({
    onSuccess: () => {
      toast.success("Test email sent! Check your inbox.")
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to send test email")
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

  // Email configuration handlers for onboarding
  const handleSaveSmtpConfig = (config: Record<string, unknown>) => {
    saveChannelConfig.mutate({
      channelType: "SMTP",
      enabled: true,
      config,
    })
  }

  const handleSaveResendConfig = (config: Record<string, unknown>) => {
    saveChannelConfig.mutate({
      channelType: "RESEND",
      enabled: true,
      config,
    })
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
    router.push("/dashboard")
    router.refresh()
  }

  const handleSendTestEmail = () => {
    if (!userEmail) {
      toast.error("No email address found")
      return
    }
    // Try SMTP first, then Resend
    const channelType = emailStatus?.smtp ? "SMTP" : "RESEND"
    sendTestEmail.mutate({
      channelType,
      testRecipient: userEmail,
    })
  }

  const goToStep = (newStep: number) => setStep(newStep)

  const isLoading = createOrg.isPending || generateKey.isPending
  const isNotificationLoading = updateNotifications.isPending
  const isSavingEmailConfig = saveChannelConfig.isPending
  const isSendingTestEmail = sendTestEmail.isPending

  return {
    step,
    goToStep,
    organizationName,
    setOrganizationName,
    apiKey,
    copied,
    isLoading,
    isNotificationLoading,
    isSavingEmailConfig,
    isSendingTestEmail,
    isEmailConfigured: emailStatus?.isEmailConfigured ?? false,
    userEmail,
    // Notification settings
    notificationSettings,
    errorSelectValue: getErrorSelectValue(),
    handleNotificationSettingChange,
    handleErrorSelectChange,
    handleSaveNotifications,
    handleSkipNotifications,
    // Email config handlers
    handleSaveSmtpConfig,
    handleSaveResendConfig,
    handleSendTestEmail,
    // Other handlers
    handleCreateOrg,
    handleEmailStepContinue,
    handleEmailStepSkip,
    handleCopyApiKey,
    handleFinish,
    // Onboarding status check
    isCheckingOnboardingStatus: isOrgsLoading || isSessionPending,
  }
}
