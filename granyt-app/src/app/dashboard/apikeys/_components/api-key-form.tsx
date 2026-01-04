"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AirflowIcon, DagsterIcon } from "@/components/icons"
import type { ApiKeyType } from "../_hooks"

interface EnvironmentInfo {
  id: string
  name: string
  isDefault: boolean
}

interface ApiKeyFormProps {
  name: string
  onNameChange: (name: string) => void
  type: ApiKeyType
  onTypeChange: (type: ApiKeyType) => void
  environmentId: string | undefined
  onEnvironmentIdChange: (id: string | undefined) => void
  environments: EnvironmentInfo[] | undefined
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isLoading: boolean
}

export function ApiKeyForm({
  name,
  onNameChange,
  type,
  onTypeChange,
  environmentId,
  onEnvironmentIdChange,
  environments,
  onSubmit,
  onCancel,
  isLoading,
}: ApiKeyFormProps) {
  return (
    <form onSubmit={onSubmit} className="p-4 border rounded-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="keyName">Key Name</Label>
        <Input
          id="keyName"
          placeholder="e.g., Production Airflow"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="keyType">Orchestrator Type</Label>
        <Select
          value={type}
          onValueChange={(value) => onTypeChange(value as ApiKeyType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="airflow">
              <div className="flex items-center gap-2">
                <AirflowIcon className="h-4 w-4" />
                Airflow
              </div>
            </SelectItem>
            <SelectItem value="dagster">
              <div className="flex items-center gap-2">
                <DagsterIcon className="h-4 w-4" />
                Dagster
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the type of orchestrator this API key will be used with.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="keyEnvironment">Environment (Optional)</Label>
        <Select
          value={environmentId || ""}
          onValueChange={(value) => onEnvironmentIdChange(value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select environment..." />
          </SelectTrigger>
          <SelectContent>
            {environments && environments.length > 0 ? (
              environments.map((env) => (
                <SelectItem key={env.id} value={env.id}>
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{env.name}</span>
                    {env.isDefault && (
                      <span className="text-xs text-muted-foreground">(default)</span>
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No environments yet. One will be created automatically.
              </div>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Environment helps organize your DAG runs. A default environment will be created if none exists.
        </p>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? "Generating..." : "Generate Key"}
        </Button>
      </div>
    </form>
  )
}
