"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { getRunStatusBadgeStyle, getRunStatusDotColor } from "@/lib/status-colors"
import { 
  ChevronDown, 
  ChevronRight, 
  BarChart3,
  Cog,
  Table2,
  AlertCircle
} from "lucide-react"

/**
 * Schema information for DataFrame captures
 */
interface SchemaInfo {
  column_dtypes: Record<string, string>
  null_counts?: Record<string, number>
  empty_string_counts?: Record<string, number>
}

/**
 * Capture point with flexible metrics structure.
 */
interface CapturePointInfo {
  id: string
  captureId: string
  taskId: string
  metrics: Record<string, unknown>
  schema: SchemaInfo | null
  capturedAt: string
}

interface TaskRunInfo {
  id: string
  srcTaskId: string
  status: string
}

interface TaskMetricsProps {
  captures: CapturePointInfo[]
  tasks: TaskRunInfo[]
}

/** Group of captures belonging to the same task */
interface TaskGroup {
  taskId: string
  status: string | null
  captures: CapturePointInfo[]
  earliestCapture: string
}

function getShortTaskId(taskId: string): string {
  const parts = taskId.split(".")
  return parts.length > 1 ? parts[parts.length - 1] : taskId
}

/**
 * Extract all metrics from a capture, flattening nested structures
 */
function getAllMetrics(metrics: Record<string, unknown>): Record<string, string | number> {
  const result: Record<string, string | number> = {}
  
  for (const [key, value] of Object.entries(metrics)) {
    // Skip columns array - too complex to display inline
    if (key === "columns" || key === "upstream") continue
    
    if (typeof value === "number") {
      result[key] = value
    } else if (typeof value === "string") {
      result[key] = value
    } else if (typeof value === "boolean") {
      result[key] = value ? "true" : "false"
    }
  }
  
  return result
}

/**
 * Format metric value for display
 */
function formatMetricValue(value: string | number): string {
  if (typeof value === "string") return value
  if (Number.isInteger(value)) return value.toLocaleString()
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

/**
 * Get a human-readable label for a metric key
 */
function getMetricLabel(key: string): string {
  // Convert snake_case to Title Case
  return key
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Group captures by taskId and order groups by earliest capture time
 */
function groupCapturesByTask(captures: CapturePointInfo[], tasks: TaskRunInfo[]): TaskGroup[] {
  if (captures.length === 0) return []

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
    const sorted = taskCaptures.sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    )
    groups.push({
      taskId,
      status: taskStatusMap.get(taskId) || null,
      captures: sorted,
      earliestCapture: sorted[0].capturedAt,
    })
  }

  return groups.sort(
    (a, b) => new Date(a.earliestCapture).getTime() - new Date(b.earliestCapture).getTime()
  )
}

/**
 * Aggregate metrics across all captures in a task
 */
function aggregateMetrics(captures: CapturePointInfo[]): Record<string, string | number> {
  const numericMetrics: Record<string, number> = {}
  const stringMetrics: Record<string, string> = {}
  
  for (const capture of captures) {
    const metrics = getAllMetrics(capture.metrics)
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === "number") {
        // Sum numeric metrics
        numericMetrics[key] = (numericMetrics[key] || 0) + value
      } else {
        // For strings, just use the last value
        stringMetrics[key] = value
      }
    }
  }
  
  return { ...stringMetrics, ...numericMetrics }
}

/**
 * Aggregate schema info from all captures in a task
 */
function aggregateSchema(captures: CapturePointInfo[]): SchemaInfo | null {
  // Find the first capture with schema info
  const captureWithSchema = captures.find(c => c.schema !== null)
  if (!captureWithSchema?.schema) return null
  
  // For multiple captures, merge null counts and empty counts
  const mergedSchema: SchemaInfo = {
    column_dtypes: { ...captureWithSchema.schema.column_dtypes },
    null_counts: {},
    empty_string_counts: {},
  }
  
  for (const capture of captures) {
    if (!capture.schema) continue
    
    // Sum up null counts
    if (capture.schema.null_counts) {
      for (const [col, count] of Object.entries(capture.schema.null_counts)) {
        mergedSchema.null_counts![col] = (mergedSchema.null_counts![col] || 0) + count
      }
    }
    
    // Sum up empty string counts
    if (capture.schema.empty_string_counts) {
      for (const [col, count] of Object.entries(capture.schema.empty_string_counts)) {
        mergedSchema.empty_string_counts![col] = (mergedSchema.empty_string_counts![col] || 0) + count
      }
    }
  }
  
  // Clean up empty objects
  if (Object.keys(mergedSchema.null_counts!).length === 0) {
    delete mergedSchema.null_counts
  }
  if (Object.keys(mergedSchema.empty_string_counts!).length === 0) {
    delete mergedSchema.empty_string_counts
  }
  
  return mergedSchema
}

/**
 * Display schema information as a table
 */
function SchemaTable({ captures }: { captures: CapturePointInfo[] }) {
  const schema = useMemo(() => aggregateSchema(captures), [captures])
  
  if (!schema) return null
  
  const columns = Object.entries(schema.column_dtypes)
  const hasNullCounts = schema.null_counts && Object.keys(schema.null_counts).length > 0
  const hasEmptyCounts = schema.empty_string_counts && Object.keys(schema.empty_string_counts).length > 0
  const hasIssues = hasNullCounts || hasEmptyCounts
  
  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Table2 className="h-4 w-4 text-muted-foreground" />
        DataFrame Schema
        <Badge variant="secondary" className="text-xs">
          {columns.length} column{columns.length !== 1 ? "s" : ""}
        </Badge>
        {hasIssues && (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-600/50">
            <AlertCircle className="h-3 w-3 mr-1" />
            Data quality issues
          </Badge>
        )}
      </h4>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 font-medium">Column</th>
              <th className="text-left p-2 font-medium">Type</th>
              {hasNullCounts && <th className="text-right p-2 font-medium">Nulls</th>}
              {hasEmptyCounts && <th className="text-right p-2 font-medium">Empty</th>}
            </tr>
          </thead>
          <tbody>
            {columns.map(([colName, dtype]) => {
              const nullCount = schema.null_counts?.[colName] ?? 0
              const emptyCount = schema.empty_string_counts?.[colName] ?? 0
              const hasColIssues = nullCount > 0 || emptyCount > 0
              
              return (
                <tr 
                  key={colName} 
                  className={cn(
                    "border-t",
                    hasColIssues && "bg-amber-500/5"
                  )}
                >
                  <td className="p-2 font-mono text-xs">{colName}</td>
                  <td className="p-2 text-muted-foreground">{dtype}</td>
                  {hasNullCounts && (
                    <td className={cn(
                      "p-2 text-right font-mono text-xs",
                      nullCount > 0 && "text-amber-600 font-medium"
                    )}>
                      {nullCount > 0 ? nullCount.toLocaleString() : "—"}
                    </td>
                  )}
                  {hasEmptyCounts && (
                    <td className={cn(
                      "p-2 text-right font-mono text-xs",
                      emptyCount > 0 && "text-amber-600 font-medium"
                    )}>
                      {emptyCount > 0 ? emptyCount.toLocaleString() : "—"}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TaskCard({ group, isExpanded, onToggle }: { 
  group: TaskGroup
  isExpanded: boolean
  onToggle: () => void 
}) {
  const aggregatedMetrics = useMemo(() => aggregateMetrics(group.captures), [group.captures])
  const metricEntries = Object.entries(aggregatedMetrics)
  
  const statusBadgeStyle = getRunStatusBadgeStyle(group.status)
  const statusDotColor = getRunStatusDotColor(group.status)

  // Show first few metrics in preview
  const previewMetrics = metricEntries.slice(0, 4)
  const hasMoreMetrics = metricEntries.length > 4

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
              <div className="mt-0.5">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", statusDotColor)} />
                  <Cog className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getShortTaskId(group.taskId)}</span>
                  {group.status && (
                    <Badge variant="outline" className={cn("text-xs", statusBadgeStyle)}>
                      {group.status}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {group.captures.length} capture{group.captures.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Metrics preview */}
                {previewMetrics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewMetrics.map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs font-normal">
                        <BarChart3 className="h-3 w-3 mr-1 text-primary" />
                        {getMetricLabel(key)}: {formatMetricValue(value)}
                      </Badge>
                    ))}
                    {hasMoreMetrics && (
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        +{metricEntries.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t">
            {/* Metrics Grid */}
            <div className="pt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {metricEntries.map(([key, value]) => (
                <div key={key} className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground truncate" title={key}>
                    {getMetricLabel(key)}
                  </div>
                  <div className="text-lg font-semibold text-primary truncate" title={String(value)}>
                    {formatMetricValue(value)}
                  </div>
                </div>
              ))}
              {metricEntries.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-4">
                  No metrics captured
                </div>
              )}
            </div>

            {/* Schema Table */}
            <SchemaTable captures={group.captures} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export function TaskMetrics({ captures, tasks }: TaskMetricsProps) {
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set())

  const taskGroups = useMemo(() => groupCapturesByTask(captures, tasks), [captures, tasks])

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
          <CardTitle>Task Metrics</CardTitle>
          <CardDescription>Metrics captured from task executions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No metrics captured for this run</p>
              <p className="text-sm mt-1">Use the granyt SDK to capture metrics</p>
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
            <CardTitle>Task Metrics</CardTitle>
            <CardDescription>
              Metrics captured from {taskGroups.length} task{taskGroups.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          {taskGroups.length > 1 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {taskGroups.map((group) => (
            <TaskCard
              key={group.taskId}
              group={group}
              isExpanded={expandedTaskIds.has(group.taskId)}
              onToggle={() => toggleExpand(group.taskId)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
