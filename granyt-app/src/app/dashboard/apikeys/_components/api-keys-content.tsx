"use client"

import { PageHeader, PageSkeleton } from "@/components/shared"
import { useApiKeysPage } from "../_hooks"
import { ApiKeysCard } from "."

export function ApiKeysContent({
  isLoading,
  apiKeys,
  environments,
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
  isGeneratingKey,
  handleGenerateKey,
  handleCopyKey,
  handleDeleteKey,
  handleDismissGeneratedKey,
}: ReturnType<typeof useApiKeysPage>) {
  if (isLoading) {
    return <PageSkeleton rows={2} />
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="API Keys"
        description="Manage API keys for your orchestrators"
      />

      <ApiKeysCard
        apiKeys={apiKeys}
        environments={environments}
        showNewKeyForm={showNewKeyForm}
        generatedKey={generatedKey}
        copied={copied}
        newKeyName={newKeyName}
        newKeyType={newKeyType}
        newKeyEnvironmentId={newKeyEnvironmentId}
        onShowFormChange={setShowNewKeyForm}
        onNameChange={setNewKeyName}
        onTypeChange={setNewKeyType}
        onEnvironmentIdChange={setNewKeyEnvironmentId}
        onSubmit={handleGenerateKey}
        onCopy={() => generatedKey && handleCopyKey(generatedKey)}
        onDone={handleDismissGeneratedKey}
        onDelete={handleDeleteKey}
        isLoading={isGeneratingKey}
      />
    </div>
  )
}
