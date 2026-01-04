"use client"

import { DataCard } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Plus, MoreVertical, Trash2, Key, HelpCircle } from "lucide-react"
import { AirflowIcon, DagsterIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import { ApiKeyForm } from "./api-key-form"
import { GeneratedKeyDisplay } from "./generated-key-display"

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  type: string
  environmentId: string | null
  environment: {
    id: string
    name: string
    isDefault: boolean
  } | null
  createdAt: string | Date
  lastUsedAt: string | Date | null
}

interface EnvironmentInfo {
  id: string
  name: string
  isDefault: boolean
}

interface ApiKeysCardProps {
  apiKeys: ApiKey[] | undefined
  environments: EnvironmentInfo[] | undefined
  showNewKeyForm: boolean
  generatedKey: string | null
  copied: boolean
  newKeyName: string
  newKeyEnvironmentId: string | undefined
  onShowFormChange: (show: boolean) => void
  onNameChange: (name: string) => void
  onEnvironmentIdChange: (id: string | undefined) => void
  onSubmit: (e: React.FormEvent) => void
  onCopy: () => void
  onDone: () => void
  onDelete: (id: string) => void
  isLoading: boolean
}

function ApiKeyItem({ 
  apiKey, 
  onDelete 
}: { 
  apiKey: ApiKey
  onDelete: () => void
}) {
  const envName = apiKey.environment?.name || "no environment"
  const isDefault = apiKey.environment?.isDefault || false
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <Key className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{apiKey.name}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "capitalize text-xs",
                envName === "production" 
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              )}
            >
              {envName}
            </Badge>
            {isDefault && (
              <Badge variant="secondary" className="text-xs">Default</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{apiKey.keyPrefix}...</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {apiKey.type === "airflow" && <AirflowIcon className="h-3 w-3" />}
              {apiKey.type === "dagster" && <DagsterIcon className="h-3 w-3" />}
              <span className="capitalize">{apiKey.type}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground text-right">
          <div>Created {new Date(apiKey.createdAt).toLocaleDateString()}</div>
          {apiKey.lastUsedAt && (
            <div>Last used {new Date(apiKey.lastUsedAt).toLocaleDateString()}</div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function EmptyApiKeysState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-8">
      <Key className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground mb-4">
        No API keys yet. Create one to authenticate the Granyt SDK.
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        New Key
      </Button>
    </div>
  )
}

export function ApiKeysCard({
  apiKeys,
  environments,
  showNewKeyForm,
  generatedKey,
  copied,
  newKeyName,
  newKeyEnvironmentId,
  onShowFormChange,
  onNameChange,
  onEnvironmentIdChange,
  onSubmit,
  onCopy,
  onDone,
  onDelete,
  isLoading,
}: ApiKeysCardProps) {
  const hasKeys = apiKeys && apiKeys.length > 0
  const showAddButton = !showNewKeyForm && !generatedKey

  return (
    <DataCard
      title={
        <div className="flex items-center gap-2">
          <span>API Keys</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px]">
              <p>API keys authenticate your Granyt SDK with the dashboard. Each key is tied to an environment to organize your DAG data.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      }
      description="Manage API keys for authenticating the Granyt SDK"
      isLoading={false}
      count={(apiKeys?.length ?? 0) + (showNewKeyForm || generatedKey ? 1 : 0)}
      itemName="API key"
      emptyState={<EmptyApiKeysState onAdd={() => onShowFormChange(true)} />}
      headerAction={
        showAddButton && (
          <Button onClick={() => onShowFormChange(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Key
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {showNewKeyForm && !generatedKey && (
          <ApiKeyForm
            name={newKeyName}
            onNameChange={onNameChange}
            environmentId={newKeyEnvironmentId}
            onEnvironmentIdChange={onEnvironmentIdChange}
            environments={environments}
            onSubmit={onSubmit}
            onCancel={() => {
              onShowFormChange(false)
              onEnvironmentIdChange(undefined)
            }}
            isLoading={isLoading}
          />
        )}

        {generatedKey && (
          <GeneratedKeyDisplay
            apiKey={generatedKey}
            copied={copied}
            onCopy={onCopy}
            onDone={onDone}
          />
        )}

        {hasKeys && (
          <div className="space-y-2">
            {apiKeys?.map((key) => (
              <ApiKeyItem
                key={key.id}
                apiKey={key}
                onDelete={() => onDelete(key.id)}
              />
            ))}
          </div>
        )}
      </div>
    </DataCard>
  )
}
