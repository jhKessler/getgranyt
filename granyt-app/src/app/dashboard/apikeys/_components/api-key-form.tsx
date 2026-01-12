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
import { Plus } from "lucide-react"

interface EnvironmentInfo {
  id: string
  name: string
  isDefault: boolean
}

interface ApiKeyFormProps {
  name: string
  onNameChange: (name: string) => void
  environmentId: string | undefined
  onEnvironmentIdChange: (id: string | undefined) => void
  environments: EnvironmentInfo[] | undefined
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isLoading: boolean
  // Environment creation props
  isCreatingEnvironmentMode: boolean
  onStartCreateEnvironment: () => void
  onCancelCreateEnvironment: () => void
  onCreateEnvironment: () => void
  newEnvironmentName: string
  onNewEnvironmentNameChange: (name: string) => void
  isCreatingEnvironment: boolean
}

export function ApiKeyForm({
  name,
  onNameChange,
  environmentId,
  onEnvironmentIdChange,
  environments,
  onSubmit,
  onCancel,
  isLoading,
  isCreatingEnvironmentMode,
  onStartCreateEnvironment,
  onCancelCreateEnvironment,
  onCreateEnvironment,
  newEnvironmentName,
  onNewEnvironmentNameChange,
  isCreatingEnvironment,
}: ApiKeyFormProps) {
  return (
    <form onSubmit={onSubmit} className="p-4 border rounded-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="keyName">Key Name</Label>
        <Input
          id="keyName"
          placeholder="e.g., Production SDK"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="keyEnvironment">Environment (Optional)</Label>
        {isCreatingEnvironmentMode ? (
          <div className="flex gap-2">
            <Input
              placeholder="Environment name (e.g., staging)"
              value={newEnvironmentName}
              onChange={(e) => onNewEnvironmentNameChange(e.target.value)}
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={onCreateEnvironment}
              disabled={isCreatingEnvironment || !newEnvironmentName.trim()}
            >
              {isCreatingEnvironment ? "Creating..." : "Create"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCancelCreateEnvironment}
              disabled={isCreatingEnvironment}
            >
              Cancel
            </Button>
          </div>
        ) : (
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
              <div className="border-t mt-1 pt-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    onStartCreateEnvironment()
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create new environment
                </button>
              </div>
            </SelectContent>
          </Select>
        )}
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
