"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"

export function useOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState("")
  const [airflowUrl, setAirflowUrl] = useState("")
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Query email configuration status
  const { data: emailStatus } = trpc.settings.getEmailEnvStatus.useQuery()

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
    // Move to API key step and generate the key
    setStep(3)
    if (organizationId) {
      generateKey.mutate({
        organizationId,
        name: "Default Key",
        type: "sdk",
      })
    }
  }

  const handleEmailStepSkip = () => {
    // Same as continue - move to API key step
    handleEmailStepContinue()
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
    isEmailConfigured: emailStatus?.isEmailConfigured ?? false,
    handleCreateOrg,
    handleEmailStepContinue,
    handleEmailStepSkip,
    handleCopyApiKey,
    handleFinish,
  }
}
