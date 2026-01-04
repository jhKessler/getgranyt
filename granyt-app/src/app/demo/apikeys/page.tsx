"use client"

import { useState } from "react"
import { ApiKeysContent } from "../../dashboard/apikeys/_components"
import { mockApiKeys, mockEnvironments } from "../_data/mock-data"

export default function DemoApiKeysPage() {
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyType, setNewKeyType] = useState<"airflow" | "dagster">("airflow")
  const [newKeyEnvironmentId, setNewKeyEnvironmentId] = useState<string | undefined>("")
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const apiKeys = mockApiKeys.map(k => ({
    ...k,
    createdAt: new Date(k.createdAt),
    lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt) : null
  }))

  const environments = mockEnvironments.map(e => ({
    ...e,
    createdAt: new Date(e.createdAt),
    updatedAt: new Date(e.updatedAt)
  }))

  return (
    <ApiKeysContent
      isLoading={false}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiKeys={apiKeys as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      environments={environments as any}
      showNewKeyForm={showNewKeyForm}
      setShowNewKeyForm={setShowNewKeyForm}
      newKeyName={newKeyName}
      setNewKeyName={setNewKeyName}
      newKeyType={newKeyType}
      setNewKeyType={setNewKeyType}
      newKeyEnvironmentId={newKeyEnvironmentId}
      setNewKeyEnvironmentId={setNewKeyEnvironmentId}
      generatedKey={generatedKey}
      copied={copied}
      isGeneratingKey={false}
      handleGenerateKey={() => {
        console.log("Generate key", { newKeyName, newKeyType, newKeyEnvironmentId })
        setGeneratedKey("granyt_test_key_123456789")
      }}
      handleCopyKey={async (key) => {
        navigator.clipboard.writeText(key)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      handleDeleteKey={(id) => console.log("Delete key", id)}
      handleDismissGeneratedKey={() => {
        setGeneratedKey(null)
        setShowNewKeyForm(false)
      }}
    />
  )
}