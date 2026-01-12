"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"

export function useApiKeysPage() {
  // API key form state
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyType, setNewKeyType] = useState("sdk")
  const [newKeyEnvironmentId, setNewKeyEnvironmentId] = useState<string | undefined>(undefined)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Environment creation state
  const [isCreatingEnvironment, setIsCreatingEnvironment] = useState(false)
  const [newEnvironmentName, setNewEnvironmentName] = useState("")
  const [newEnvironmentAirflowUrl, setNewEnvironmentAirflowUrl] = useState("")

  // Queries
  const { data: organizations, isLoading: orgsLoading } = trpc.organization.list.useQuery()
  const organizationId = organizations?.[0]?.id

  const { data: apiKeys, isLoading: keysLoading, refetch: refetchKeys } = trpc.organization.listApiKeys.useQuery(
    { organizationId: organizationId! },
    { enabled: !!organizationId }
  )

  const { data: environments, isLoading: envsLoading, refetch: refetchEnvironments } = trpc.organization.listEnvironments.useQuery(
    { organizationId: organizationId! },
    { enabled: !!organizationId }
  )

  // Mutations
  const generateKey = trpc.organization.generateApiKey.useMutation({
    onSuccess: (data: { key: string }) => {
      setGeneratedKey(data.key)
      setNewKeyName("")
      setNewKeyType("sdk")
      setNewKeyEnvironmentId(undefined)
      refetchKeys()
      toast.success("API key generated!")
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to generate API key")
    },
  })

  const deleteKey = trpc.organization.deleteApiKey.useMutation({
    onSuccess: () => {
      refetchKeys()
      toast.success("API key deleted")
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete API key")
    },
  })

  const createEnvironment = trpc.organization.createEnvironment.useMutation({
    onSuccess: (data: { id: string }) => {
      setNewKeyEnvironmentId(data.id)
      setNewEnvironmentName("")
      setNewEnvironmentAirflowUrl("")
      setIsCreatingEnvironment(false)
      refetchEnvironments()
      toast.success("Environment created!")
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create environment")
    },
  })

  // Handlers
  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim() || !organizationId) return

    generateKey.mutate({
      organizationId,
      name: newKeyName.trim(),
      type: newKeyType,
      environmentId: newKeyEnvironmentId,
    })
  }

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteKey = (id: string) => {
    if (confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      deleteKey.mutate({ id })
    }
  }

  const handleDismissGeneratedKey = () => {
    setGeneratedKey(null)
    setShowNewKeyForm(false)
    setNewKeyName("")
    setNewKeyType("sdk")
    setNewKeyEnvironmentId(undefined)
  }

  const handleCreateEnvironment = () => {
    if (!newEnvironmentName.trim() || !organizationId) return
    createEnvironment.mutate({
      organizationId,
      name: newEnvironmentName.trim(),
      airflowUrl: newEnvironmentAirflowUrl.trim() || undefined,
    })
  }

  const handleCancelCreateEnvironment = () => {
    setIsCreatingEnvironment(false)
    setNewEnvironmentName("")
    setNewEnvironmentAirflowUrl("")
  }

  const isLoading = orgsLoading || keysLoading || envsLoading

  return {
    // State
    isLoading,
    apiKeys,
    environments,
    
    // API key form
    showNewKeyForm,
    setShowNewKeyForm,
    newKeyName,
    setNewKeyName,
    newKeyType,
    setNewKeyType,
    newKeyEnvironmentId,
    setNewKeyEnvironmentId,
    generatedKey,
    copied,
    
    // Loading states
    isGeneratingKey: generateKey.isPending,
    isCreatingEnvironment: createEnvironment.isPending,

    // Environment creation
    isCreatingEnvironmentMode: isCreatingEnvironment,
    setIsCreatingEnvironmentMode: setIsCreatingEnvironment,
    newEnvironmentName,
    setNewEnvironmentName,
    newEnvironmentAirflowUrl,
    setNewEnvironmentAirflowUrl,

    // Handlers
    handleGenerateKey,
    handleCopyKey,
    handleDeleteKey,
    handleDismissGeneratedKey,
    handleCreateEnvironment,
    handleCancelCreateEnvironment,
  }
}
