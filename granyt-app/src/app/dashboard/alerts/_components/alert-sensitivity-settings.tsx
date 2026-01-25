"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Settings, TrendingDown, Info, AlertTriangle, Columns, Globe } from "lucide-react"
import { SensitivityLevel } from "./types"
import { AlertType } from "@prisma/client"

interface EnvironmentInfo {
  id: string
  name: string
  isDefault: boolean
}

interface AlertSettingValue {
  sensitivity: SensitivityLevel
  enabled: boolean
  customThreshold?: number | null
  enabledEnvironments?: string[]
}

interface AlertSettings {
  ROW_COUNT_DROP?: AlertSettingValue
  NULL_OCCURRENCE?: AlertSettingValue
  SCHEMA_CHANGE?: AlertSettingValue
}

interface AlertSensitivitySettingsProps {
  settings?: AlertSettings
  isLoading: boolean
  isPending: boolean
  environments?: EnvironmentInfo[]
  onEnabledChange: (alertType: AlertType, enabled: boolean) => void
  onCustomThresholdSave: (threshold: number) => void
  onEnvironmentsChange?: (alertType: AlertType, environments: string[]) => void
}

export function AlertSensitivitySettings({
  settings,
  isLoading,
  isPending,
  environments = [],
  onEnabledChange,
  onCustomThresholdSave,
  onEnvironmentsChange,
}: AlertSensitivitySettingsProps) {
  const [customThresholdInput, setCustomThresholdInput] = useState<string>("95")

  useEffect(() => {
    if (settings?.ROW_COUNT_DROP?.customThreshold) {
      setCustomThresholdInput(settings.ROW_COUNT_DROP.customThreshold.toString())
    }
  }, [settings?.ROW_COUNT_DROP?.customThreshold])

  const handleCustomThresholdSave = () => {
    const threshold = parseInt(customThresholdInput, 10)
    if (isNaN(threshold) || threshold < 1 || threshold > 99) {
      return
    }
    onCustomThresholdSave(threshold)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Alert Settings</CardTitle>
        </div>
        <CardDescription>
          Configure when alerts are triggered for your DAGs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="space-y-4">
            <RowCountDropSetting
              settings={settings}
              isPending={isPending}
              customThresholdInput={customThresholdInput}
              environments={environments}
              onCustomThresholdChange={setCustomThresholdInput}
              onCustomThresholdSave={handleCustomThresholdSave}
              onEnabledChange={onEnabledChange}
              onEnvironmentsChange={onEnvironmentsChange}
            />

            <NullOccurrenceSetting
              settings={settings}
              isPending={isPending}
              environments={environments}
              onEnabledChange={onEnabledChange}
              onEnvironmentsChange={onEnvironmentsChange}
            />

            <SchemaChangeSetting
              settings={settings}
              isPending={isPending}
              environments={environments}
              onEnabledChange={onEnabledChange}
              onEnvironmentsChange={onEnvironmentsChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface RowCountDropSettingProps {
  settings?: AlertSettings
  isPending: boolean
  customThresholdInput: string
  environments: EnvironmentInfo[]
  onCustomThresholdChange: (value: string) => void
  onCustomThresholdSave: () => void
  onEnabledChange: (alertType: "ROW_COUNT_DROP", enabled: boolean) => void
  onEnvironmentsChange?: (alertType: AlertType, environments: string[]) => void
}

function RowCountDropSetting({
  settings,
  isPending,
  customThresholdInput,
  environments,
  onCustomThresholdChange,
  onCustomThresholdSave,
  onEnabledChange,
  onEnvironmentsChange,
}: RowCountDropSettingProps) {
  const isEnabled = settings?.ROW_COUNT_DROP?.enabled ?? true
  const savedThreshold = settings?.ROW_COUNT_DROP?.customThreshold ?? 95
  const enabledEnvironments = settings?.ROW_COUNT_DROP?.enabledEnvironments ?? []

  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-muted/30">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-orange-500" />
          <span className="font-medium">Row Count Drop Detection</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Detects when a DAG output has significantly fewer rows than the historical baseline. Useful for catching data quality issues early.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {isEnabled ? (
          <p className="text-sm text-muted-foreground">
            Alert triggers when row count drops by {savedThreshold}% or more
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Detection disabled</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isEnabled && (
          <>
            <EnvironmentSelector
              alertType="ROW_COUNT_DROP"
              selectedEnvironments={enabledEnvironments}
              availableEnvironments={environments}
              isPending={isPending}
              onEnvironmentsChange={onEnvironmentsChange}
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-threshold" className="text-sm text-muted-foreground whitespace-nowrap">
                Threshold
              </Label>
              <Input
                id="custom-threshold"
                type="number"
                min={1}
                max={99}
                value={customThresholdInput}
                onChange={(e) => onCustomThresholdChange(e.target.value)}
                className="w-16 h-8"
                disabled={isPending}
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button
                size="sm"
                variant="outline"
                onClick={onCustomThresholdSave}
                disabled={isPending || customThresholdInput === savedThreshold.toString()}
                className="h-8"
              >
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </>
        )}

        <Switch
          id="row-count-enabled"
          checked={isEnabled}
          onCheckedChange={(checked: boolean) => onEnabledChange("ROW_COUNT_DROP", checked)}
          disabled={isPending}
        />
      </div>
    </div>
  )
}

interface NullOccurrenceSettingProps {
  settings?: AlertSettings
  isPending: boolean
  environments: EnvironmentInfo[]
  onEnabledChange: (alertType: AlertType, enabled: boolean) => void
  onEnvironmentsChange?: (alertType: AlertType, environments: string[]) => void
}

function NullOccurrenceSetting({ settings, isPending, environments, onEnabledChange, onEnvironmentsChange }: NullOccurrenceSettingProps) {
  const isEnabled = settings?.NULL_OCCURRENCE?.enabled ?? true
  const enabledEnvironments = settings?.NULL_OCCURRENCE?.enabledEnvironments ?? []

  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-muted/30">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="font-medium">Null Value Detection</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Detects when a column that has historically never had null values suddenly contains nulls. This indicates potential data quality issues.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          {isEnabled
            ? "Alert when columns that never had nulls suddenly have them"
            : "Detection disabled"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isEnabled && (
          <EnvironmentSelector
            alertType="NULL_OCCURRENCE"
            selectedEnvironments={enabledEnvironments}
            availableEnvironments={environments}
            isPending={isPending}
            onEnvironmentsChange={onEnvironmentsChange}
          />
        )}
        <Switch
          id="null-occurrence-enabled"
          checked={isEnabled}
          onCheckedChange={(checked: boolean) => onEnabledChange("NULL_OCCURRENCE", checked)}
          disabled={isPending}
        />
      </div>
    </div>
  )
}

interface SchemaChangeSettingProps {
  settings?: AlertSettings
  isPending: boolean
  environments: EnvironmentInfo[]
  onEnabledChange: (alertType: AlertType, enabled: boolean) => void
  onEnvironmentsChange?: (alertType: AlertType, environments: string[]) => void
}

function SchemaChangeSetting({ settings, isPending, environments, onEnabledChange, onEnvironmentsChange }: SchemaChangeSettingProps) {
  const isEnabled = settings?.SCHEMA_CHANGE?.enabled ?? true
  const enabledEnvironments = settings?.SCHEMA_CHANGE?.enabledEnvironments ?? []

  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-muted/30">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Columns className="h-4 w-4 text-blue-500" />
          <span className="font-medium">Schema Change Detection</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Detects when columns are added, removed, or have their data type changed between DAG runs. Helps catch unexpected schema drift.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          {isEnabled
            ? "Alert when columns are added, removed, or change type"
            : "Detection disabled"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isEnabled && (
          <EnvironmentSelector
            alertType="SCHEMA_CHANGE"
            selectedEnvironments={enabledEnvironments}
            availableEnvironments={environments}
            isPending={isPending}
            onEnvironmentsChange={onEnvironmentsChange}
          />
        )}
        <Switch
          id="schema-change-enabled"
          checked={isEnabled}
          onCheckedChange={(checked: boolean) => onEnabledChange("SCHEMA_CHANGE", checked)}
          disabled={isPending}
        />
      </div>
    </div>
  )
}

// Environment selector component for selecting which environments trigger alerts
interface EnvironmentSelectorProps {
  alertType: AlertType
  selectedEnvironments: string[]
  availableEnvironments: EnvironmentInfo[]
  isPending: boolean
  onEnvironmentsChange?: (alertType: AlertType, environments: string[]) => void
}

function EnvironmentSelector({
  alertType,
  selectedEnvironments,
  availableEnvironments,
  isPending,
  onEnvironmentsChange,
}: EnvironmentSelectorProps) {
  const allSelected = selectedEnvironments.length === 0

  if (availableEnvironments.length === 0) {
    return null
  }

  const handleAllChange = (checked: boolean) => {
    if (checked) {
      onEnvironmentsChange?.(alertType, [])
    }
  }

  const handleEnvironmentChange = (envName: string, checked: boolean) => {
    if (allSelected) {
      // Switching from "all" to specific - select only this one
      onEnvironmentsChange?.(alertType, [envName])
    } else if (checked) {
      onEnvironmentsChange?.(alertType, [...selectedEnvironments, envName])
    } else {
      const newEnvs = selectedEnvironments.filter(e => e !== envName)
      // If removing the last one, revert to "all environments"
      onEnvironmentsChange?.(alertType, newEnvs.length === 0 ? [] : newEnvs)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending} className="h-8 gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          <span className="text-xs">
            {allSelected
              ? "All envs"
              : selectedEnvironments.length === 1
                ? selectedEnvironments[0]
                : `${selectedEnvironments.length} envs`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${alertType}-all`}
              checked={allSelected}
              onCheckedChange={handleAllChange}
              disabled={isPending}
            />
            <Label htmlFor={`${alertType}-all`} className="text-sm font-medium">
              All environments
            </Label>
          </div>
          <Separator />
          <div className="space-y-2">
            {availableEnvironments.map((env) => (
              <div key={env.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${alertType}-${env.id}`}
                  checked={!allSelected && selectedEnvironments.includes(env.name)}
                  onCheckedChange={(checked) => handleEnvironmentChange(env.name, !!checked)}
                  disabled={isPending}
                />
                <Label htmlFor={`${alertType}-${env.id}`} className="text-sm flex items-center gap-1.5">
                  {env.name}
                  {env.isDefault && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      default
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
