"use client"

import { useDocumentTitle } from "@/lib/use-document-title"
import {
  ProgressSteps,
  OrganizationStep,
  EmailSetupStep,
  ApiKeyStep,
} from "./_components"
import { useOnboarding } from "./_hooks"

export default function OnboardingPage() {
  useDocumentTitle("Onboarding")
  const {
    step,
    organizationName,
    setOrganizationName,
    airflowUrl,
    setAirflowUrl,
    apiKey,
    copied,
    isLoading,
    isEmailConfigured,
    handleCreateOrg,
    handleEmailStepContinue,
    handleEmailStepSkip,
    handleCopyApiKey,
    handleFinish,
  } = useOnboarding()

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
          />
        )}

        {step === 3 && (
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
