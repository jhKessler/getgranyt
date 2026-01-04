"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { SENSITIVITY_OPTIONS, SensitivityLevel, AlertData, isBinaryAlert } from "./types"

interface ExpectedBehaviorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alert: AlertData
  isPending: boolean
  onSubmit: (sensitivity: SensitivityLevel, customThreshold?: number, enabled?: boolean) => void
}

export function ExpectedBehaviorDialog({
  open,
  onOpenChange,
  alert,
  isPending,
  onSubmit,
}: ExpectedBehaviorDialogProps) {
  const [selectedSensitivity, setSelectedSensitivity] = useState<string>("LOW")
  const [customThreshold, setCustomThreshold] = useState<string>("95")
  const [isEnabled, setIsEnabled] = useState(true)

  const isBinary = isBinaryAlert(alert.alertType)

  const handleSubmit = () => {
    const threshold = selectedSensitivity === "CUSTOM" ? parseInt(customThreshold, 10) : undefined
    onSubmit(selectedSensitivity as SensitivityLevel, threshold, isEnabled)
  }

  const isSubmitDisabled = isPending || 
    (!isBinary && selectedSensitivity === "CUSTOM" && 
      (!customThreshold || parseInt(customThreshold) < 1 || parseInt(customThreshold) > 99))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isBinary ? "Configure Alert" : "Adjust Alert Sensitivity"}
          </DialogTitle>
          <DialogDescription>
            {isBinary 
              ? `Enable or disable ${alert.alertType.replace("_", " ").toLowerCase()} alerts for `
              : "Choose a new sensitivity level for "
            }
            <strong>{alert.srcDagId}</strong>
            {alert.captureId && <> → <strong>{alert.captureId}</strong></>}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isBinary ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Alert Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for {alert.alertType.replace("_", " ").toLowerCase()}
                </p>
              </div>
              <Switch 
                checked={isEnabled} 
                onCheckedChange={setIsEnabled}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Sensitivity Level</Label>
                <Select value={selectedSensitivity} onValueChange={setSelectedSensitivity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SENSITIVITY_OPTIONS).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium", config.color)}>{config.label}</span>
                          <span className="text-muted-foreground text-xs">- {config.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSensitivity === "CUSTOM" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-threshold">
                    Drop Percentage Threshold
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="custom-threshold"
                      type="number"
                      min="1"
                      max="99"
                      value={customThreshold}
                      onChange={(e) => setCustomThreshold(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      % drop triggers alert
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alert triggers when row count drops by this percentage or more (1-99)
                  </p>
                </div>
              )}
            </>
          )}
          
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">What this does:</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Updates the {isBinary ? "status" : "sensitivity"} for this specific pipeline/capture point</li>
              <li>• Dismisses this alert automatically</li>
              <li>• Future runs will use the new {isBinary ? "setting" : "sensitivity level"}</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isPending ? "Saving..." : "Save & Dismiss"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
