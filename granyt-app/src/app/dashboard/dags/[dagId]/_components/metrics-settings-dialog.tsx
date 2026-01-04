"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings2, GripVertical, RotateCcw, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import {
  MetricType,
  Aggregation,
  DEFAULT_METRICS,
  MAX_SELECTED_METRICS,
  BUILTIN_METRICS,
  type MetricConfig,
} from "@/server/services/dag-metrics/types"
import { cn } from "@/lib/utils"

// Sortable metric item component
function SortableMetricItem({
  metric,
  label,
  onToggle,
  disabled,
  enabledCount,
}: {
  metric: MetricConfig
  label: string
  onToggle: (id: string, enabled: boolean) => void
  disabled: boolean
  enabledCount: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metric.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isAtMax = enabledCount >= MAX_SELECTED_METRICS && !metric.enabled

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card",
        isDragging && "opacity-50 shadow-lg",
        !metric.enabled && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        disabled={disabled}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <Checkbox
        id={metric.id}
        checked={metric.enabled}
        onCheckedChange={(checked) => onToggle(metric.id, checked as boolean)}
        disabled={disabled || isAtMax}
      />

      <Label
        htmlFor={metric.id}
        className={cn(
          "flex-1 cursor-pointer",
          isAtMax && "text-muted-foreground"
        )}
      >
        {label}
        {metric.aggregation && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {metric.aggregation}
          </Badge>
        )}
      </Label>

      {metric.type === MetricType.Custom && (
        <Badge variant="outline" className="text-xs">
          Custom
        </Badge>
      )}
    </div>
  )
}

interface MetricsSettingsDialogProps {
  dagId: string
  onSettingsChange?: () => void
}

export function MetricsSettingsDialog({
  dagId,
  onSettingsChange,
}: MetricsSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [localMetrics, setLocalMetrics] = useState<MetricConfig[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Fetch current settings
  const { data: settings, isLoading: settingsLoading, refetch } = trpc.dagMetrics.getSettings.useQuery(
    { dagId },
    { enabled: open }
  )

  // Fetch available metrics for this DAG
  const { data: availableMetrics, isLoading: availableLoading } = trpc.dagMetrics.getAvailableMetrics.useQuery(
    { dagId },
    { enabled: open }
  )

  // Check if DAG has an override
  const { data: hasOverride } = trpc.dagMetrics.hasOverride.useQuery(
    { dagId },
    { enabled: open }
  )

  // Save mutation
  const saveMutation = trpc.dagMetrics.saveSettings.useMutation({
    onSuccess: () => {
      toast.success("Metric settings saved")
      setHasUnsavedChanges(false)
      refetch()
      onSettingsChange?.()
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`)
    },
  })

  // Delete override mutation
  const deleteOverrideMutation = trpc.dagMetrics.deleteOverride.useMutation({
    onSuccess: () => {
      toast.success("Reset to system defaults")
      setHasUnsavedChanges(false)
      refetch()
      onSettingsChange?.()
    },
    onError: (error) => {
      toast.error(`Failed to reset: ${error.message}`)
    },
  })

  // Initialize local metrics when data loads
  useEffect(() => {
    if (settings && availableMetrics) {
      // Start with existing settings
      const existingIds = new Set(settings.selectedMetrics.map((m) => m.id))
      const allMetrics: MetricConfig[] = [...settings.selectedMetrics]

      // Add any missing builtin metrics
      for (const builtin of BUILTIN_METRICS) {
        if (!existingIds.has(builtin.id)) {
          allMetrics.push({
            id: builtin.id,
            type: MetricType.Builtin,
            enabled: false,
            order: allMetrics.length,
          })
        }
      }

      // Add custom metrics (avg, total, and last)
      for (const name of availableMetrics.customMetrics) {
        const avgId = `custom:${name}:avg`
        const totalId = `custom:${name}:total`
        const lastId = `custom:${name}:last`

        if (!existingIds.has(avgId)) {
          allMetrics.push({
            id: avgId,
            type: MetricType.Custom,
            aggregation: Aggregation.Avg,
            enabled: false,
            order: allMetrics.length,
          })
        }
        if (!existingIds.has(totalId)) {
          allMetrics.push({
            id: totalId,
            type: MetricType.Custom,
            aggregation: Aggregation.Total,
            enabled: false,
            order: allMetrics.length,
          })
        }
        if (!existingIds.has(lastId)) {
          allMetrics.push({
            id: lastId,
            type: MetricType.Custom,
            aggregation: Aggregation.Last,
            enabled: false,
            order: allMetrics.length,
          })
        }
      }

      // Sort by order
      allMetrics.sort((a, b) => a.order - b.order)

      setLocalMetrics(allMetrics)
      setHasUnsavedChanges(false)
    }
  }, [settings, availableMetrics])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setLocalMetrics((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        // Update order values
        return newItems.map((item, idx) => ({ ...item, order: idx }))
      })
      setHasUnsavedChanges(true)
    }
  }

  const handleToggle = (id: string, enabled: boolean) => {
    setLocalMetrics((items) =>
      items.map((item) => (item.id === id ? { ...item, enabled } : item))
    )
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    saveMutation.mutate({
      dagId,
      selectedMetrics: localMetrics,
    })
  }

  const handleResetToDefault = () => {
    if (hasOverride) {
      deleteOverrideMutation.mutate({ dagId })
    } else {
      // Reset to system defaults
      setLocalMetrics((items) =>
        items.map((item) => {
          const defaultMetric = DEFAULT_METRICS.find((d) => d.id === item.id)
          return {
            ...item,
            enabled: defaultMetric?.enabled ?? false,
            order: defaultMetric?.order ?? item.order,
          }
        })
      )
      setHasUnsavedChanges(true)
    }
  }

  const getMetricLabel = (metric: MetricConfig): string => {
    // Builtin metrics
    const builtin = BUILTIN_METRICS.find((b) => b.id === metric.id)
    if (builtin) return builtin.label

    // Custom metrics - extract name from id
    // Format: "custom:name:agg"
    const parts = metric.id.split(":")
    if (parts.length >= 2) {
      const name = parts[1]
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
      return name
    }

    return metric.id
  }

  const enabledCount = localMetrics.filter((m) => m.enabled).length
  const isLoading = settingsLoading || availableLoading
  const isSaving = saveMutation.isPending || deleteOverrideMutation.isPending

  // Separate metrics by type for display
  const builtinMetrics = localMetrics.filter((m) => m.type === MetricType.Builtin)
  const customMetrics = localMetrics.filter((m) => m.type === MetricType.Custom)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Customize Metrics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Metrics</DialogTitle>
          <DialogDescription>
            Select and order up to {MAX_SELECTED_METRICS} metrics to display.
            {settings?.isDefault && !hasOverride && (
              <span className="block mt-1 text-xs">
                Using default settings. Changes will create an override for this DAG.
              </span>
            )}
            {hasOverride && (
              <span className="block mt-1 text-xs text-primary">
                This DAG has custom settings.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-2">
            {/* Builtin metrics */}
            <div>
              <h4 className="text-sm font-medium mb-2">Built-in Metrics</h4>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={builtinMetrics.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {builtinMetrics.map((metric) => (
                      <SortableMetricItem
                        key={metric.id}
                        metric={metric}
                        label={getMetricLabel(metric)}
                        onToggle={handleToggle}
                        disabled={isSaving}
                        enabledCount={enabledCount}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Custom metrics */}
            {customMetrics.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Custom Metrics</h4>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={customMetrics.map((m) => m.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {customMetrics.map((metric) => (
                          <SortableMetricItem
                            key={metric.id}
                            metric={metric}
                            label={getMetricLabel(metric)}
                            onToggle={handleToggle}
                            disabled={isSaving}
                            enabledCount={enabledCount}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToDefault}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {hasOverride ? "Remove Override" : "Reset to Default"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {enabledCount}/{MAX_SELECTED_METRICS} selected
            </span>
            <Button onClick={handleSave} disabled={!hasUnsavedChanges || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
