"use client"

import { useDocumentTitle } from "@/lib/use-document-title"
import {
  ProgressSteps,
  OrganizationStep,
  ApiKeyStep,
} from "./_components"
import { useOnboarding } from "./_hooks"

export default function OnboardingPage() {
  useDocumentTitle("Onboarding")
  const {
    step,
    organizationName,
    setOrganizationName,
    apiKey,
    copied,
    isLoading,
    handleCreateOrg,
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
            onSubmit={handleCreateOrg}
            isLoading={isLoading}
          />
        )}

        {step === 2 && (
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
