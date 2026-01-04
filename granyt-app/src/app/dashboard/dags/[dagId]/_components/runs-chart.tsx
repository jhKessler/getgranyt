"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { format } from "date-fns"
import { trpc } from "@/lib/trpc"
import { Timeframe } from "@/server/services/dashboard/types"
import { parseMetricsJson } from "@/lib/json-schemas"
import { useDagDetailFilters } from "@/lib/filters-context"
import { getRunStatusChartColor } from "@/lib/status-colors"

// Helper to format metric names for display
function formatMetricName(name: string): string {
  // Convert snake_case or camelCase to Title Case
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

// Helper to get short task ID (last part after dot)
function getShortTaskId(taskId: string): string {
  const parts = taskId.split(".")
  return parts.length > 1 ? parts[parts.length - 1] : taskId
}

// Helper to format values
function formatValue(value: number, metricId: string): string {
  if (metricId === "duration") return `${value}s`
  // Generic number formatting for custom metrics
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  if (Number.isInteger(value)) return value.toLocaleString()
  return value.toFixed(2)
}

// Helper to get Y-axis formatter
function getYAxisFormatter(metricId: string): (value: number) => string {
  if (metricId === "duration") return (v) => `${v}s`
  // Generic formatter for custom metrics
  return (v) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
    return v.toString()
  }
}

// Built-in metric definitions (only duration is guaranteed available)
const BUILTIN_METRICS = [
  { id: "duration", label: "Duration", unit: "s" },
] as const

interface RunsChartProps {
  dagId: string
  environment?: string | null
  timeframe: Timeframe
  snapshots?: SnapshotData[]
  availableMetrics?: { id: string; label: string; type: "builtin" | "custom" }[]
  isLoading?: boolean
  basePath?: string
}

// Type for the snapshot data from the API
export interface SnapshotData {
  id: string
  duration: number | null
  rowsProcessed: bigint
  taskCount: number
  errorCount: number
  successRate: number | null
  customMetrics: unknown
  dagRun: {
    id: string
    srcRunId: string
    status: string
    startTime: Date | string
    runType: string | null
  }
}

export function RunsChart({ 
  dagId, 
  environment, 
  timeframe,
  snapshots: propSnapshots,
  availableMetrics: propAvailableMetrics,
  isLoading: propLoading,
  basePath = "/dashboard"
}: RunsChartProps) {
  const router = useRouter()
  const { selectedRunHistoryMetric, setRunHistoryMetric } = useDagDetailFilters(dagId)

  // Fetch metric snapshots
  const { data: contextSnapshots, isLoading: snapshotsLoading } = trpc.dashboard.getRunMetricSnapshots.useQuery({
    dagId,
    timeframe,
    environment: environment ?? undefined,
    limit: 50,
  }, {
    enabled: !!dagId && !propSnapshots,
  })

  // Fetch available metrics for the selector
  const { data: contextAvailableMetrics, isLoading: metricsLoading } = trpc.dashboard.getAvailableRunMetrics.useQuery({
    dagId,
    environment: environment ?? undefined,
  }, {
    enabled: !!dagId && !propAvailableMetrics,
  })

  const snapshots = propSnapshots ?? contextSnapshots
  const availableMetrics = propAvailableMetrics ?? contextAvailableMetrics
  const isLoading = propLoading ?? (snapshotsLoading || metricsLoading)

  // Build the metric options
  const metricOptions = useMemo(() => {
    const options: { id: string; label: string; type: "builtin" | "custom" }[] = []

    // Add built-in metrics
    for (const metric of BUILTIN_METRICS) {
      options.push({ id: metric.id, label: metric.label, type: "builtin" })
    }

    // Add custom metrics
    if (availableMetrics) {
      if (Array.isArray(availableMetrics)) {
        // If it's already an array of options, add the custom ones
        for (const metric of availableMetrics) {
          if (metric.type === "custom") {
            options.push(metric)
          }
        }
      } else if ("customMetrics" in availableMetrics && Array.isArray(availableMetrics.customMetrics)) {
        // If it's the TRPC response object
        for (const name of availableMetrics.customMetrics) {
          options.push({
            id: `custom:${name}`,
            label: formatMetricName(name),
            type: "custom",
          })
        }
      }
    }

    return options
  }, [availableMetrics])

  // Build chart data from snapshots
  type ChartDataItem = {
    name: string;
    fullDate: string;
    value: number;
    status: string;
    runId: string;
    runType: string | null;
  };

  const chartData: ChartDataItem[] = useMemo(() => {
    if (!snapshots) return []

    // Cast to avoid excessive type instantiation depth from tRPC
    const snapshotData = snapshots as unknown as SnapshotData[]

    return [...snapshotData].reverse().map((snapshot): ChartDataItem => {
      // Extract the metric value based on selection
      let value = 0

      if (selectedRunHistoryMetric.startsWith("custom:")) {
        // Handle both formats:
        // - "custom:metricName" (flat format)
        // - "custom:taskId:metricName" (task-grouped format)
        const parts = selectedRunHistoryMetric.split(":")
        const metricName = parts.length >= 3 ? parts[2] : parts[1]
        const customMetrics = parseMetricsJson(snapshot.customMetrics)
        const rawValue = customMetrics?.[metricName]
        value = typeof rawValue === "number" ? rawValue : 0
      } else {
        // Built-in metric
        switch (selectedRunHistoryMetric) {
          case "duration":
            value = snapshot.duration ?? 0
            break
          case "rowsProcessed":
            value = Number(snapshot.rowsProcessed)
            break
          case "taskCount":
            value = snapshot.taskCount
            break
          case "errorCount":
            value = snapshot.errorCount
            break
          case "successRate":
            value = snapshot.successRate ?? 0
            break
        }
      }

      return {
        name: format(new Date(snapshot.dagRun.startTime), "MMM d HH:mm"),
        fullDate: format(new Date(snapshot.dagRun.startTime), "MMM d, yyyy HH:mm"),
        value,
        status: snapshot.dagRun.status,
        runId: snapshot.dagRun.id,
        runType: snapshot.dagRun.runType,
      }
    })
  }, [snapshots, selectedRunHistoryMetric])

  // Get the selected metric label
  const selectedMetricLabel = useMemo(() => {
    // First try builtin metrics
    const builtinMatch = metricOptions.find((m) => m.id === selectedRunHistoryMetric)
    if (builtinMatch) return builtinMatch.label
    
    // For custom metrics, extract the metric name
    // Handle both "custom:metricName" and "custom:taskId:metricName" formats
    if (selectedRunHistoryMetric.startsWith("custom:")) {
      const parts = selectedRunHistoryMetric.split(":")
      return parts.length >= 3 ? parts[2] : parts[1]
    }
    
    return "Duration"
  }, [selectedRunHistoryMetric])

  // Get the description based on metric type
  const getDescription = () => {
    const baseDesc = `${selectedMetricLabel} of recent runs`
    if (selectedRunHistoryMetric === "duration") {
      return `${baseDesc} (green = success, red = failed)`
    }
    return baseDesc
  }

  // Get custom metrics grouped by task for the dropdown
  const customMetricsByTask = useMemo(() => {
    if (!availableMetrics) return new Map<string, string[]>()
    
    // Check if we have the new task-grouped format
    if (!Array.isArray(availableMetrics) && "customMetricsWithTasks" in availableMetrics && availableMetrics.customMetricsWithTasks) {
      const grouped = new Map<string, string[]>()
      for (const { name, taskId } of availableMetrics.customMetricsWithTasks) {
        if (!grouped.has(taskId)) {
          grouped.set(taskId, [])
        }
        if (!grouped.get(taskId)!.includes(name)) {
          grouped.get(taskId)!.push(name)
        }
      }
      // Sort metric names within each task
      for (const [taskId, metrics] of grouped) {
        grouped.set(taskId, metrics.sort())
      }
      return grouped
    }
    
    // Fallback: no task grouping, put all under "unknown"
    const names: string[] = Array.isArray(availableMetrics) 
      ? availableMetrics.filter(m => m.type === "custom").map(m => m.id.replace("custom:", ""))
      : (availableMetrics.customMetrics || [])
    
    if (names.length === 0) return new Map<string, string[]>()
    return new Map([["_all", names.sort()]])
  }, [availableMetrics])

  // Check if we need task grouping (more than one task with custom metrics OR same metric in multiple tasks)
  const needsTaskGrouping = useMemo(() => {
    if (customMetricsByTask.size === 0) return false
    if (customMetricsByTask.size > 1) return true
    // Check if we have the "_all" fallback key
    if (customMetricsByTask.has("_all")) return false
    return true
  }, [customMetricsByTask])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Run History</CardTitle>
            <CardDescription>{getDescription()}</CardDescription>
          </div>
          <Select value={selectedRunHistoryMetric} onValueChange={setRunHistoryMetric}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              {/* Built-in metrics */}
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground">
                  Built-in Metrics
                </SelectLabel>
                {BUILTIN_METRICS.map((metric) => (
                  <SelectItem key={metric.id} value={metric.id}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectGroup>

              {/* Custom metrics - grouped by task if needed */}
              {customMetricsByTask.size > 0 && needsTaskGrouping && (
                <>
                  {Array.from(customMetricsByTask.entries()).map(([taskId, metricNames]) => (
                    <SelectGroup key={taskId}>
                      <SelectLabel className="text-xs font-semibold text-muted-foreground">
                        {getShortTaskId(taskId)}
                      </SelectLabel>
                      {metricNames.map((name) => (
                        <SelectItem 
                          key={`custom:${taskId}:${name}`} 
                          value={`custom:${taskId}:${name}`}
                        >
                          {formatMetricName(name)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </>
              )}

              {/* Custom metrics - flat list when no grouping needed */}
              {customMetricsByTask.size > 0 && !needsTaskGrouping && (
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground">
                    Custom Metrics
                  </SelectLabel>
                  {Array.from(customMetricsByTask.values()).flat().map((name) => (
                    <SelectItem key={`custom:${name}`} value={`custom:${name}`}>
                      {formatMetricName(name)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            No data available for the selected timeframe
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={getYAxisFormatter(selectedRunHistoryMetric)}
                />
                <Tooltip 
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ChartDataItem
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="flex flex-col gap-1">
                            <span className="text-[0.70rem] uppercase text-muted-foreground font-medium">
                              {data.fullDate}
                            </span>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-2 w-2 rounded-full" 
                                style={{ backgroundColor: getRunStatusChartColor(data.status) }}
                              />
                              <span className="font-bold text-sm">
                                {formatValue(data.value, selectedRunHistoryMetric)} {selectedMetricLabel}
                              </span>
                            </div>
                            <div className="flex flex-col mt-1 pt-1 border-t">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[0.65rem] text-muted-foreground">Status: <span className="capitalize font-medium text-foreground">{data.status}</span></span>
                                {data.runType === "manual" && (
                                  <span className="text-[0.65rem] bg-primary/10 text-primary px-1 rounded font-medium">Manual</span>
                                )}
                              </div>
                              <span className="text-[0.65rem] text-muted-foreground font-mono">ID: {data.runId.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(data) => {
                    const payload = data?.payload as { runId?: string } | undefined
                    if (payload?.runId) {
                      router.push(`${basePath}/dags/${encodeURIComponent(dagId)}/runs/${encodeURIComponent(payload.runId)}`)
                    }
                  }}
                >
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    content={(props: any) => {
                      const { x, y, width, value, index } = props;
                      const data = chartData[index];
                      if (!data || value === 0) return null;
                      
                      const formattedValue = formatValue(value, selectedRunHistoryMetric);
                      const isManual = data.runType === "manual";
                      
                      return (
                        <g>
                          <text 
                            x={x + width / 2} 
                            y={y - 6} 
                            fill="var(--muted-foreground)" 
                            textAnchor="middle" 
                            fontSize={10}
                          >
                            {formattedValue}
                          </text>
                          {isManual && (
                            <text 
                              x={x + width / 2} 
                              y={y - 18} 
                              fill="var(--primary)" 
                              textAnchor="middle" 
                              fontSize={10}
                              fontWeight="bold"
                            >
                              M
                            </text>
                          )}
                        </g>
                      );
                    }}
                  />
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={getRunStatusChartColor(entry.status)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
