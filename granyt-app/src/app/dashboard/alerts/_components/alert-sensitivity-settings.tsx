"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Settings, TrendingDown, Info, AlertTriangle, Columns } from "lucide-react"
import { SENSITIVITY_CONFIG, SensitivityLevel } from "./types"
import { AlertType } from "@prisma/client"

interface AlertSettings {
  ROW_COUNT_DROP?: {
    sensitivity: SensitivityLevel
    enabled: boolean
    customThreshold?: number | null
  }
  NULL_OCCURRENCE?: {
    sensitivity: SensitivityLevel
    enabled: boolean
    customThreshold?: number | null
  }
  SCHEMA_CHANGE?: {
    sensitivity: SensitivityLevel
    enabled: boolean
    customThreshold?: number | null
  }
}

interface AlertSensitivitySettingsProps {
  settings?: AlertSettings
  isLoading: boolean
  isPending: boolean
  onSensitivityChange: (alertType: AlertType, sensitivity: string, customThreshold?: number) => void
  onEnabledChange: (alertType: AlertType, enabled: boolean) => void
  onCustomThresholdSave: (threshold: number) => void
}

export function AlertSensitivitySettings({
  settings,
  isLoading,
  isPending,
  onSensitivityChange,
  onEnabledChange,
  onCustomThresholdSave,
}: AlertSensitivitySettingsProps) {
  const [customThresholdInput, setCustomThresholdInput] = useState<string>("95")
  const [showCustomInput, setShowCustomInput] = useState(false)

  useEffect(() => {
    if (settings?.ROW_COUNT_DROP?.sensitivity === "CUSTOM" && settings.ROW_COUNT_DROP.customThreshold) {
      setCustomThresholdInput(settings.ROW_COUNT_DROP.customThreshold.toString())
      setShowCustomInput(true)
    } else if (settings?.ROW_COUNT_DROP?.sensitivity && settings.ROW_COUNT_DROP.sensitivity !== "CUSTOM") {
      setShowCustomInput(false)
    }
  }, [settings?.ROW_COUNT_DROP?.sensitivity, settings?.ROW_COUNT_DROP?.customThreshold])

  const handleSensitivityChange = (value: string) => {
    if (value === "CUSTOM") {
      setShowCustomInput(true)
      return
    }
    setShowCustomInput(false)
    onSensitivityChange("ROW_COUNT_DROP", value)
  }

  const handleCustomThresholdSave = () => {
    const threshold = parseInt(customThresholdInput, 10)
    if (isNaN(threshold) || threshold < 1 || threshold > 99) {
      return
    }
    onCustomThresholdSave(threshold)
  }

  const currentSensitivity = settings?.ROW_COUNT_DROP?.sensitivity ?? "MEDIUM"
  const currentDescription = currentSensitivity === "CUSTOM" 
    ? `Custom threshold: ${settings?.ROW_COUNT_DROP?.customThreshold ?? customThresholdInput}%`
    : SENSITIVITY_CONFIG[currentSensitivity]?.description

  const currentThreshold = currentSensitivity === "CUSTOM"
    ? `${settings?.ROW_COUNT_DROP?.customThreshold ?? customThresholdInput}%`
    : (SENSITIVITY_CONFIG[currentSensitivity]?.threshold || "95%")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Alert Sensitivity</CardTitle>
        </div>
        <CardDescription>
          Configure when alerts are triggered. Higher sensitivity means alerts trigger on smaller drops.
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
              currentDescription={currentDescription}
              currentThreshold={currentThreshold}
              customThresholdInput={customThresholdInput}
              onSensitivityChange={handleSensitivityChange}
              onEnabledChange={onEnabledChange}
            />
            
            {showCustomInput && (
              <CustomThresholdInput
                value={customThresholdInput}
                onChange={setCustomThresholdInput}
                onSave={handleCustomThresholdSave}
                isPending={isPending}
              />
            )}

            <NullOccurrenceSetting
              settings={settings}
              isPending={isPending}
              onEnabledChange={onEnabledChange}
            />

            <SchemaChangeSetting
              settings={settings}
              isPending={isPending}
              onEnabledChange={onEnabledChange}
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
  currentDescription?: string
  currentThreshold: string
  customThresholdInput: string
  onSensitivityChange: (value: string) => void
  onEnabledChange: (alertType: "ROW_COUNT_DROP", enabled: boolean) => void
}

function RowCountDropSetting({
  settings,
  isPending,
  currentDescription,
  currentThreshold,
  customThresholdInput: _customThresholdInput,
  onSensitivityChange,
  onEnabledChange,
}: RowCountDropSettingProps) {
  const currentSensitivity = settings?.ROW_COUNT_DROP?.sensitivity ?? "MEDIUM"
  const isEnabled = settings?.ROW_COUNT_DROP?.enabled ?? true

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
        <p className="text-sm text-muted-foreground">
          {currentDescription}
        </p>
        {currentSensitivity !== "DISABLED" && (
          <p className="text-xs text-muted-foreground">
            Alert triggers when row count drops by {currentThreshold} or more
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="row-count-enabled" className="text-sm text-muted-foreground">
            Enabled
          </Label>
          <Switch
            id="row-count-enabled"
            checked={isEnabled}
            onCheckedChange={(checked: boolean) => onEnabledChange("ROW_COUNT_DROP", checked)}
            disabled={isPending}
          />
        </div>
        
        <Select
          value={currentSensitivity}
          onValueChange={onSensitivityChange}
          disabled={isPending || !isEnabled}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HIGH">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                High
              </div>
            </SelectItem>
            <SelectItem value="MEDIUM">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Medium
              </div>
            </SelectItem>
            <SelectItem value="LOW">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Low
              </div>
            </SelectItem>
            <SelectItem value="DISABLED">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                Disabled
              </div>
            </SelectItem>
            <SelectItem value="CUSTOM">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                Custom
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

interface CustomThresholdInputProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  isPending: boolean
}

function CustomThresholdInput({ value, onChange, onSave, isPending }: CustomThresholdInputProps) {
  return (
    <div className="flex items-center gap-2 mt-3 p-3 bg-muted/50 rounded-lg">
      <Label htmlFor="custom-threshold" className="text-sm whitespace-nowrap">
        Alert when row count drops by
      </Label>
      <Input
        id="custom-threshold"
        type="number"
        min={1}
        max={99}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20"
        placeholder="95"
      />
      <span className="text-sm text-muted-foreground">% or more</span>
      <Button
        size="sm"
        onClick={onSave}
        disabled={isPending}
        className="ml-2"
      >
        {isPending ? "Saving..." : "Apply"}
      </Button>
    </div>
  )
}

interface NullOccurrenceSettingProps {
  settings?: AlertSettings
  isPending: boolean
  onEnabledChange: (alertType: AlertType, enabled: boolean) => void
}

function NullOccurrenceSetting({ settings, isPending, onEnabledChange }: NullOccurrenceSettingProps) {
  const isEnabled = settings?.NULL_OCCURRENCE?.enabled ?? true

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
      
      <div className="flex items-center gap-2">
        <Label htmlFor="null-occurrence-enabled" className="text-sm text-muted-foreground">
          Enabled
        </Label>
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
  onEnabledChange: (alertType: AlertType, enabled: boolean) => void
}

function SchemaChangeSetting({ settings, isPending, onEnabledChange }: SchemaChangeSettingProps) {
  const isEnabled = settings?.SCHEMA_CHANGE?.enabled ?? true

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
      
      <div className="flex items-center gap-2">
        <Label htmlFor="schema-change-enabled" className="text-sm text-muted-foreground">
          Enabled
        </Label>
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
