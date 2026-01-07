"use client"

import { useDocumentTitle } from "@/lib/use-document-title"
import { Loader2 } from "lucide-react"
import {
  ProgressSteps,
  OrganizationStep,
  EmailSetupStep,
  NotificationPreferencesStep,
  ApiKeyStep,
} from "./_components"
import { useOnboarding } from "./_hooks"

export default function OnboardingPage() {
  useDocumentTitle("Onboarding")
  const {
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
    isSavingEmailConfig,
    isSendingTestEmail,
    isEmailConfigured,
    userEmail,
    // Notification settings
    notificationSettings,
    errorSelectValue,
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
    isCheckingOnboardingStatus,
  } = useOnboarding()

  // Show loading state while checking if onboarding is already completed
  if (isCheckingOnboardingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">
        <ProgressSteps currentStep={step} />

        {step === 1 && (
          <OrganizationStep
            organizationName={organizationName}
            onOrganizationNameChange={setOrganizationName}
            airflowUrl={airflowUrl}
            onAirflowUrlChange={setAirflowUrl}
            onSubmit={handleCreateOrg}
            isLoading={isLoading}
          />
        )}

        {step === 2 && (
          <EmailSetupStep
            isEmailConfigured={isEmailConfigured}
            onSkip={handleEmailStepSkip}
            onContinue={handleEmailStepContinue}
            onBack={() => goToStep(1)}
            onSaveSmtp={handleSaveSmtpConfig}
            onSaveResend={handleSaveResendConfig}
            onSendTestEmail={handleSendTestEmail}
            isSavingConfig={isSavingEmailConfig}
            isSendingTest={isSendingTestEmail}
            userEmail={userEmail}
          />
        )}

        {step === 3 && (
          <NotificationPreferencesStep
            settings={notificationSettings}
            onSettingChange={handleNotificationSettingChange}
            onErrorSelectChange={handleErrorSelectChange}
            errorSelectValue={errorSelectValue}
            onSave={handleSaveNotifications}
            onSkip={handleSkipNotifications}
            onBack={() => goToStep(2)}
            isLoading={isNotificationLoading}
            isEmailConfigured={isEmailConfigured}
          />
        )}

        {step === 4 && (
          <ApiKeyStep
            apiKey={apiKey}
            onCopyApiKey={handleCopyApiKey}
            onFinish={handleFinish}
            copied={copied}
            isGenerating={isLoading}
          />
        )}
      </div>
    </div>
  )
}
