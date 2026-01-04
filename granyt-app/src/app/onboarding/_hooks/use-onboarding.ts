"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import type { OrchestratorType } from "../_components"

export function useOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [organizationName, setOrganizationName] = useState("")
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<OrchestratorType>("airflow")
  const [keyName, setKeyName] = useState("")
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: (data: { id: string }) => {
      setOrganizationId(data.id)
      setStep(2)
      toast.success("Organization created!")
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create organization")
    },
  })

  const generateKey = trpc.organization.generateApiKey.useMutation({
    onSuccess: (data: { key: string }) => {
      setApiKey(data.key)
      toast.success("API key generated!")
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
    createOrg.mutate({ name: organizationName.trim() })
  }

  const handleGenerateKey = () => {
    if (!organizationId || !keyName.trim()) return
    generateKey.mutate({
      organizationId,
      name: keyName.trim(),
      type: selectedType,
    })
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

  const goToStep = (newStep: number) => setStep(newStep)

  const isLoading = createOrg.isPending || generateKey.isPending

  return {
    step,
    goToStep,
    organizationName,
    setOrganizationName,
    selectedType,
    setSelectedType,
    keyName,
    setKeyName,
    apiKey,
    copied,
    isLoading,
    handleCreateOrg,
    handleGenerateKey,
    handleCopyApiKey,
    handleFinish,
  }
}
