"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getRunStatusBadgeStyle, getRunStatusDotColor } from "@/lib/status-colors"
import { 
  ChevronDown, 
  ChevronRight, 
  Database, 
  ArrowDown, 
  Columns, 
  HardDrive,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Cog
} from "lucide-react"

interface ColumnInfo {
  name: string
  dtype: string
  nullCount: number | null
  emptyStringCount: number | null
}

/**
 * Capture point with flexible metrics structure.
 * All metrics are stored in a single JSON object.
 */
interface CapturePointInfo {
  id: string
  captureId: string
  taskId: string
  metrics: Record<string, unknown>
  capturedAt: string
}

// Helper functions to extract metrics from the flexible JSON
function getRowCount(metrics: Record<string, unknown>): number {
  const val = metrics.row_count
  return typeof val === "number" ? val : 0
}

function getColumnCount(metrics: Record<string, unknown>): number {
  const val = metrics.column_count
  return typeof val === "number" ? val : 0
}

function getMemoryBytes(metrics: Record<string, unknown>): number | null {
  const val = metrics.memory_bytes
  return typeof val === "number" ? val : null
}

function getColumns(metrics: Record<string, unknown>): ColumnInfo[] {
  const val = metrics.columns
  if (!Array.isArray(val)) return []
  return val.map((col: Record<string, unknown>) => ({
    name: String(col.name ?? ""),
    dtype: String(col.dtype ?? ""),
    nullCount: typeof col.null_count === "number" ? col.null_count : null,
    emptyStringCount: typeof col.empty_string_count === "number" ? col.empty_string_count : null,
  }))
}

function getCustomMetrics(metrics: Record<string, unknown>): Record<string, number> {
  // Extract all numeric metrics that aren't standard fields
  const standardFields = new Set(["row_count", "column_count", "memory_bytes", "dataframe_type", "columns", "upstream"])
  const custom: Record<string, number> = {}
  for (const [key, val] of Object.entries(metrics)) {
    if (!standardFields.has(key) && typeof val === "number") {
      custom[key] = val
    }
  }
  return custom
}

interface TaskRunInfo {
  id: string
  srcTaskId: string
  status: string
}

interface DataFlowFunnelProps {
  captures: CapturePointInfo[]
  tasks: TaskRunInfo[]
}

/** Group of captures belonging to the same task */
interface TaskGroup {
  taskId: string
  status: string | null
  captures: CapturePointInfo[]
  totalRows: number
  totalColumns: number
  earliestCapture: string
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "-"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function getShortTaskId(taskId: string): string {
  const parts = taskId.split(".")
  return parts.length > 1 ? parts[parts.length - 1] : taskId
}

/**
 * Group captures by taskId and order groups by earliest capture time
 */
function groupCapturesByTask(captures: CapturePointInfo[], tasks: TaskRunInfo[]): TaskGroup[] {
  if (captures.length === 0) return []

  // Build a map from srcTaskId to status
  const taskStatusMap = new Map<string, string>()
  for (const task of tasks) {
    taskStatusMap.set(task.srcTaskId, task.status)
  }

  const taskMap = new Map<string, CapturePointInfo[]>()

  for (const capture of captures) {
    const existing = taskMap.get(capture.taskId) || []
    existing.push(capture)
    taskMap.set(capture.taskId, existing)
  }

  const groups: TaskGroup[] = []
  for (const [taskId, taskCaptures] of taskMap) {
    // Sort captures within task by time
    const sorted = taskCaptures.sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    )
    groups.push({
      taskId,
      status: taskStatusMap.get(taskId) || null,
      captures: sorted,
      totalRows: sorted.reduce((sum, c) => sum + getRowCount(c.metrics), 0),
      totalColumns: sorted.reduce((sum, c) => sum + getColumnCount(c.metrics), 0),
      earliestCapture: sorted[0].capturedAt,
    })
  }

  // Sort task groups by earliest capture time
  return groups.sort(
    (a, b) => new Date(a.earliestCapture).getTime() - new Date(b.earliestCapture).getTime()
  )
}

/** Aggregated column info across all captures in a task */
interface AggregatedColumn {
  name: string
  dtype: string
  totalNulls: number
  totalEmpty: number
}

/** Aggregate all columns from captures, merging same-named columns */
function aggregateColumns(captures: CapturePointInfo[]): AggregatedColumn[] {
  const columnMap = new Map<string, AggregatedColumn>()
  
  for (const capture of captures) {
    const cols = getColumns(capture.metrics)
    for (const col of cols) {
      const existing = columnMap.get(col.name)
      if (existing) {
        existing.totalNulls += col.nullCount || 0
        existing.totalEmpty += col.emptyStringCount || 0
      } else {
        columnMap.set(col.name, {
          name: col.name,
          dtype: col.dtype,
          totalNulls: col.nullCount || 0,
          totalEmpty: col.emptyStringCount || 0,
        })
      }
    }
  }
  
  return Array.from(columnMap.values())
}

/** Aggregate all custom metrics from captures */
function aggregateCustomMetrics(captures: CapturePointInfo[]): Record<string, number> {
  const metrics: Record<string, number> = {}
  
  for (const capture of captures) {
    const customMetrics = getCustomMetrics(capture.metrics)
    for (const [key, value] of Object.entries(customMetrics)) {
      // If metric exists, sum them; otherwise set it
      if (key in metrics) {
        metrics[key] += value
      } else {
        metrics[key] = value
      }
    }
  }
  
  return metrics
}

function TaskCard({ group, isExpanded, onToggle }: { 
  group: TaskGroup
  isExpanded: boolean
  onToggle: () => void 
}) {
  const aggregatedColumns = useMemo(() => aggregateColumns(group.captures), [group.captures])
  const aggregatedMetrics = useMemo(() => aggregateCustomMetrics(group.captures), [group.captures])
  
  const totalNulls = aggregatedColumns.reduce((sum, col) => sum + col.totalNulls, 0)
  const totalEmpty = aggregatedColumns.reduce((sum, col) => sum + col.totalEmpty, 0)
  const hasIssues = totalNulls > 0 || totalEmpty > 0
  const hasCustomMetrics = Object.keys(aggregatedMetrics).length > 0
  const totalMemory = group.captures.reduce((sum, c) => sum + (getMemoryBytes(c.metrics) || 0), 0)
  
  const statusBadgeStyle = getRunStatusBadgeStyle(group.status)
  const statusDotColor = getRunStatusDotColor(group.status)

  return (
    <div className={cn(
      "border rounded-lg bg-card transition-all duration-200 hover:border-primary/50",
      statusBadgeStyle && `border-l-4 ${statusBadgeStyle.split(' ').find(c => c.startsWith('border-'))}`
    )}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full p-4 h-auto justify-start hover:bg-muted/50"
          >
            <div className="flex items-start gap-4 w-full">
              {/* Expand icon */}
              <div className="mt-0.5">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>

              {/* Main content */}
              <div className="flex-1 text-left space-y-2">
                <div className="flex items-center gap-2">
                  {/* Status dot */}
                  <div className={cn("h-2.5 w-2.5 rounded-full", statusDotColor)} />
                  <Cog className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getShortTaskId(group.taskId)}</span>
                  {group.status && (
                    <Badge variant="outline" className={cn("text-xs", statusBadgeStyle)}>
                      {group.status}
                    </Badge>
                  )}
                  {hasIssues && (
                    <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                  )}
                  {hasCustomMetrics && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Has custom metrics</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-bold text-primary">
                      {group.totalRows.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-xs">rows</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Columns className="h-3.5 w-3.5" />
                    <span>{aggregatedColumns.length} columns</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>{formatBytes(totalMemory)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Estimated memory usage</p>
                    </TooltipContent>
                  </Tooltip>
                  {hasIssues && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-yellow-600 cursor-help">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{totalNulls.toLocaleString()} nulls, {totalEmpty.toLocaleString()} empty</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Data quality issues detected</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Custom metrics preview */}
                {hasCustomMetrics && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(aggregatedMetrics).slice(0, 4).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs font-normal">
                        <BarChart3 className="h-3 w-3 mr-1 text-blue-500" />
                        {key}: {typeof value === 'number' && !Number.isInteger(value) 
                          ? value.toFixed(2) 
                          : value.toLocaleString()}
                      </Badge>
                    ))}
                    {Object.keys(aggregatedMetrics).length > 4 && (
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        +{Object.keys(aggregatedMetrics).length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t space-y-4">
            {/* Custom Metrics Section */}
            {hasCustomMetrics && (
              <div className="pt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Custom Metrics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(aggregatedMetrics).map(([key, value]) => (
                    <div key={key} className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground truncate" title={key}>
                        {key}
                      </div>
                      <div className="text-lg font-semibold text-primary">
                        {typeof value === 'number' && !Number.isInteger(value) 
                          ? value.toFixed(4) 
                          : value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Columns Table */}
            <div className={hasCustomMetrics ? "" : "pt-4"}>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Columns className="h-4 w-4 text-muted-foreground" />
                Column Details
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium">Column</th>
                      <th className="text-left py-2 pr-4 font-medium">Type</th>
                      <th className="text-right py-2 pr-4 font-medium">
                        <div className="flex items-center justify-end gap-1">
                          Nulls
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Count of NULL/None values</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </th>
                      <th className="text-right py-2 font-medium">
                        <div className="flex items-center justify-end gap-1">
                          Empty Strings
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Count of empty string values</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedColumns.map((col) => (
                      <tr key={col.name} className="border-b border-muted/50 last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">{col.name}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="text-xs font-mono">
                            {col.dtype}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <span className={cn(col.totalNulls > 0 && "text-yellow-600 font-medium")}>
                            {col.totalNulls.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <span className={cn(col.totalEmpty > 0 && "text-yellow-600 font-medium")}>
                            {col.totalEmpty.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function FlowConnector() {
  return (
    <div className="flex flex-col items-center py-3 relative group">
      <div className="h-8 w-px bg-border relative">
        <svg className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-4 overflow-visible">
          <line 
            x1="8" y1="0" x2="8" y2="32" 
            className="stroke-primary/30 stroke-[2] transition-colors" 
          />
          <line 
            x1="8" y1="0" x2="8" y2="32" 
            className="stroke-primary stroke-[2] animate-flow opacity-40 group-hover:opacity-100 transition-opacity" 
            style={{ strokeDasharray: "4 4" }}
          />
        </svg>
        <ArrowDown className="absolute -bottom-2 -left-2 h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
      </div>
    </div>
  )
}

export function DataFlowFunnel({ captures, tasks }: DataFlowFunnelProps) {
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set())

  const taskGroups = useMemo(() => groupCapturesByTask(captures, tasks), [captures, tasks])

  const totalRowsSum = useMemo(() => 
    captures.reduce((acc, c) => acc + getRowCount(c.metrics), 0),
  [captures])

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedTaskIds(new Set(taskGroups.map(g => g.taskId)))
  }

  const collapseAll = () => {
    setExpandedTaskIds(new Set())
  }

  if (captures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Flow</CardTitle>
          <CardDescription>Capture points showing data transformation through the DAG</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No data metrics captured for this run</p>
              <p className="text-sm mt-1">Use the granyt SDK to capture DataFrame metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Flow by Task</CardTitle>
            <CardDescription>
              Data metrics grouped by task execution
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-6 p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tasks</span>
            <span className="text-xl font-bold text-primary">{taskGroups.length}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Captures</span>
            <span className="text-xl font-bold text-primary">{captures.length}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Rows</span>
            <span className="text-xl font-bold text-primary">{totalRowsSum.toLocaleString()}</span>
          </div>
        </div>
        <div className="space-y-0">
          {taskGroups.map((group, index) => (
            <div key={group.taskId}>
              <TaskCard
                group={group}
                isExpanded={expandedTaskIds.has(group.taskId)}
                onToggle={() => toggleExpand(group.taskId)}
              />
              {index < taskGroups.length - 1 && (
                <FlowConnector />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
