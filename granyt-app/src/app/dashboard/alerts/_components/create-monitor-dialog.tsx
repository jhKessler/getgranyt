"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { Lightbulb, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CreateMonitorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AlertType = "CUSTOM_METRIC_DROP" | "CUSTOM_METRIC_DEGRADATION"

export function CreateMonitorDialog({ open, onOpenChange }: CreateMonitorDialogProps) {
  // Form state
  const [selectedDag, setSelectedDag] = useState<string>("")
  const [selectedMetric, setSelectedMetric] = useState<string>("")
  const [alertType, setAlertType] = useState<AlertType>("CUSTOM_METRIC_DEGRADATION")
  const [dropThreshold, setDropThreshold] = useState("95")
  const [declinePercent, setDeclinePercent] = useState("15")
  const [windowDays, setWindowDays] = useState("14")
  const [monitorName, setMonitorName] = useState("")

  // Fetch DAGs
  const { data: dags, isLoading: isLoadingDags } = trpc.dashboard.getDagsOverview.useQuery(
    {},
    { enabled: open }
  )

  // Fetch available metrics for selected DAG
  const { data: metrics, isLoading: isLoadingMetrics } = trpc.alerts.getAvailableCustomMetrics.useQuery(
    { srcDagId: selectedDag },
    { enabled: open && !!selectedDag }
  )

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedDag("")
      setSelectedMetric("")
      setAlertType("CUSTOM_METRIC_DEGRADATION")
      setDropThreshold("95")
      setDeclinePercent("15")
      setWindowDays("14")
      setMonitorName("")
    }
  }, [open])

  // Auto-generate monitor name
  useEffect(() => {
    if (selectedMetric && selectedDag) {
      const metricLabel = selectedMetric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      setMonitorName(`${metricLabel} Monitor`)
    }
  }, [selectedMetric, selectedDag])

  const utils = trpc.useUtils()
  const createMutation = trpc.alerts.createMetricMonitor.useMutation({
    onSuccess: () => {
      utils.alerts.getMetricMonitors.invalidate()
      toast.success("Monitor created successfully")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error("Failed to create monitor", { description: error.message })
    },
  })

  const handleCreate = () => {
    if (!selectedDag || !selectedMetric || !monitorName) {
      toast.error("Please fill in all required fields")
      return
    }

    if (alertType === "CUSTOM_METRIC_DEGRADATION") {
      const percent = parseInt(declinePercent)
      const days = parseInt(windowDays)
      if (isNaN(percent) || percent < 1 || percent > 100) {
        toast.error("Percentage must be between 1 and 100")
        return
      }
      if (isNaN(days) || days < 1 || days > 90) {
        toast.error("Days must be between 1 and 90")
        return
      }
    }

    createMutation.mutate({
      name: monitorName,
      srcDagId: selectedDag,
      metricName: selectedMetric,
      alertType,
      ...(alertType === "CUSTOM_METRIC_DROP"
        ? {
            sensitivity: dropThreshold === "90" ? "HIGH" : dropThreshold === "95" ? "MEDIUM" : "LOW",
          }
        : {
            minDeclinePercent: parseInt(declinePercent),
            windowDays: parseInt(windowDays),
          }),
    })
  }

  const isFormValid = selectedDag && selectedMetric && monitorName

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Metric Monitor</DialogTitle>
          <DialogDescription>
            Set up automatic monitoring for a custom metric
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sentence builder: Alert me when [metric] in [dag] */}
          <div className="space-y-3">
            <p className="text-base">
              Alert me when{" "}
              <Select value={selectedMetric} onValueChange={setSelectedMetric} disabled={!selectedDag}>
                <SelectTrigger className="inline-flex w-44 h-8 mx-1">
                  <SelectValue placeholder="select metric" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingMetrics ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : metrics && metrics.length > 0 ? (
                    metrics.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      {selectedDag ? "No custom metrics found" : "Select a DAG first"}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {" "}in{" "}
              <Select value={selectedDag} onValueChange={setSelectedDag}>
                <SelectTrigger className="inline-flex w-44 h-8 mx-1">
                  <SelectValue placeholder="select DAG" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDags ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : dags && dags.length > 0 ? (
                    dags.map((dag) => (
                      <SelectItem key={dag.dagId} value={dag.dagId}>
                        {dag.dagId}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      No DAGs found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </p>
          </div>

          {/* Alert type selection with inline configuration */}
          <RadioGroup
            value={alertType}
            onValueChange={(v) => setAlertType(v as AlertType)}
            className="space-y-3"
          >
            {/* Sharp Drop Option */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <RadioGroupItem value="CUSTOM_METRIC_DROP" id="sharp-drop" className="mt-1" />
              <Label htmlFor="sharp-drop" className="flex-1 cursor-pointer">
                <span className="flex flex-wrap items-center gap-1">
                  drops suddenly by more than{" "}
                  <Select
                    value={dropThreshold}
                    onValueChange={setDropThreshold}
                    disabled={alertType !== "CUSTOM_METRIC_DROP"}
                  >
                    <SelectTrigger className="inline-flex w-20 h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                  {" "}from its baseline
                </span>
              </Label>
            </div>

            {/* Slow Degradation Option */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <RadioGroupItem value="CUSTOM_METRIC_DEGRADATION" id="degradation" className="mt-1" />
              <Label htmlFor="degradation" className="flex-1 cursor-pointer">
                <span className="flex flex-wrap items-center gap-1">
                  consistently declines by{" "}
                  <span className="inline-flex items-center">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={declinePercent}
                      onChange={(e) => setDeclinePercent(e.target.value)}
                      disabled={alertType !== "CUSTOM_METRIC_DEGRADATION"}
                      className="w-16 h-7 text-center"
                    />
                    <span className="ml-1">%</span>
                  </span>
                  {" "}over{" "}
                  <span className="inline-flex items-center">
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={windowDays}
                      onChange={(e) => setWindowDays(e.target.value)}
                      disabled={alertType !== "CUSTOM_METRIC_DEGRADATION"}
                      className="w-16 h-7 text-center"
                    />
                    <span className="ml-1">days</span>
                  </span>
                </span>
              </Label>
            </div>
          </RadioGroup>

          {/* Info box */}
          {selectedMetric && selectedDag && (
            <div className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {alertType === "CUSTOM_METRIC_DROP" ? (
                  <>
                    This will create an alert if <strong>{selectedMetric}</strong> drops more than{" "}
                    {dropThreshold}% compared to its historical baseline.
                  </>
                ) : (
                  <>
                    This will create an alert if <strong>{selectedMetric}</strong> shows a consistent
                    downward trend of {declinePercent}% or more over a {windowDays}-day period.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Monitor name */}
          <div className="space-y-2">
            <Label htmlFor="monitor-name">Monitor name</Label>
            <Input
              id="monitor-name"
              value={monitorName}
              onChange={(e) => setMonitorName(e.target.value)}
              placeholder="e.g., Login Rate Monitor"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isFormValid || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Monitor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
