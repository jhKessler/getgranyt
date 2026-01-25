"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Gauge, Plus, MoreVertical, TrendingDown, Activity, Loader2 } from "lucide-react"
import { CreateMonitorDialog } from "./create-monitor-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function MetricMonitorsList() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const utils = trpc.useUtils()
  const { data: monitors, isLoading } = trpc.alerts.getMetricMonitors.useQuery({})

  const toggleMutation = trpc.alerts.toggleMetricMonitor.useMutation({
    onSuccess: () => {
      utils.alerts.getMetricMonitors.invalidate()
    },
    onError: (error) => {
      toast.error("Failed to toggle monitor", { description: error.message })
    },
  })

  const deleteMutation = trpc.alerts.deleteMetricMonitor.useMutation({
    onSuccess: () => {
      utils.alerts.getMetricMonitors.invalidate()
      toast.success("Monitor deleted")
    },
    onError: (error) => {
      toast.error("Failed to delete monitor", { description: error.message })
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Metric Monitors
          </CardTitle>
          <CardDescription>Custom metric monitoring rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Metric Monitors
            </CardTitle>
            <CardDescription>Custom metric monitoring rules</CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Monitor
          </Button>
        </CardHeader>
        <CardContent>
          {!monitors || monitors.length === 0 ? (
            <EmptyState onCreateClick={() => setShowCreateDialog(true)} />
          ) : (
            <div className="space-y-3">
              {monitors.map((monitor: MetricMonitor) => (
                <MonitorCard
                  key={monitor.id}
                  monitor={monitor}
                  onToggle={(enabled) => {
                    toggleMutation.mutate({ id: monitor.id, enabled })
                  }}
                  onDelete={() => {
                    deleteMutation.mutate({ id: monitor.id })
                  }}
                  isToggling={toggleMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateMonitorDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  )
}

type MetricMonitor = {
  id: string
  name: string
  srcDagId: string
  metricName: string
  alertType: string
  sensitivity: string
  customThreshold: number | null
  windowDays: number
  minDeclinePercent: number
  enabled: boolean
}

interface MonitorCardProps {
  monitor: MetricMonitor
  onToggle: (enabled: boolean) => void
  onDelete: () => void
  isToggling: boolean
}

function MonitorCard({ monitor, onToggle, onDelete, isToggling }: MonitorCardProps) {
  const isSharpDrop = monitor.alertType === "CUSTOM_METRIC_DROP"

  return (
    <div className={cn(
      "flex items-start justify-between gap-4 p-4 rounded-lg border",
      monitor.enabled ? "bg-muted/30" : "bg-muted/10 opacity-60"
    )}>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {isSharpDrop ? (
            <TrendingDown className="h-4 w-4 text-orange-500" />
          ) : (
            <Activity className="h-4 w-4 text-purple-500" />
          )}
          <span className="font-medium">{monitor.name}</span>
          <Badge variant="outline" className="text-xs">
            {isSharpDrop ? "Sharp Drop" : "Degradation"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Monitoring <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{monitor.metricName}</span> on{" "}
          <span className="font-medium">{monitor.srcDagId}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {isSharpDrop ? (
            <>
              Alerts when metric drops{" "}
              {monitor.sensitivity === "CUSTOM" && monitor.customThreshold
                ? `${monitor.customThreshold}%`
                : monitor.sensitivity === "HIGH"
                ? "90%"
                : monitor.sensitivity === "MEDIUM"
                ? "95%"
                : "99%"}
              + from baseline
            </>
          ) : (
            <>
              Alerts when metric declines {monitor.minDeclinePercent}% over {monitor.windowDays} days
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Switch
          checked={monitor.enabled}
          onCheckedChange={onToggle}
          disabled={isToggling}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Gauge className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="font-semibold mb-1">No metric monitors yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Create a monitor to track custom metrics from your DAGs and get alerted when they drop or degrade over time.
      </p>
      <Button onClick={onCreateClick}>
        <Plus className="h-4 w-4 mr-2" />
        Create Your First Monitor
      </Button>
    </div>
  )
}
