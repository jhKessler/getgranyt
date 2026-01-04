"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format } from "date-fns"
import { useMemo } from "react"

interface DataPoint {
  runId: string
  srcRunId: string
  startTime: string
  rowCount: number
  columnCount: number
  memoryBytes: number | null
  columns: Array<{
    name: string
    dtype: string
    null_count: number | null
    empty_string_count: number | null
  }>
  capturedAt: string
}

interface CaptureTimeline {
  captureId: string
  taskId: string
  dataPoints: DataPoint[]
  upstream: string[] | null
}

interface RowCountTimelineChartProps {
  timelines: CaptureTimeline[]
  isLoading: boolean
}

// Generate consistent colors for each capture ID
const COLORS = [
  "hsl(221, 83%, 53%)",  // Blue
  "hsl(142, 76%, 36%)",  // Green
  "hsl(262, 83%, 58%)",  // Purple
  "hsl(24, 94%, 50%)",   // Orange
  "hsl(340, 82%, 52%)",  // Pink
  "hsl(173, 80%, 40%)",  // Teal
  "hsl(43, 96%, 56%)",   // Yellow
  "hsl(199, 89%, 48%)",  // Cyan
]

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

function getShortTaskId(captureId: string): string {
  // captureId is typically "dag_id.task_id", we want just task_id
  const parts = captureId.split(".")
  return parts.length > 1 ? parts[parts.length - 1] : captureId
}

export function RowCountTimelineChart({ timelines, isLoading }: RowCountTimelineChartProps) {
  // Transform data for recharts - each run becomes an x-axis point
  const chartData = useMemo(() => {
    if (!timelines.length) return []

    // Collect all unique runs across all timelines, ordered by time
    const runsMap = new Map<string, { srcRunId: string; startTime: string }>()
    
    for (const timeline of timelines) {
      for (const dp of timeline.dataPoints) {
        if (!runsMap.has(dp.runId)) {
          runsMap.set(dp.runId, { srcRunId: dp.srcRunId, startTime: dp.startTime })
        }
      }
    }

    // Sort runs by start time
    const sortedRuns = Array.from(runsMap.entries())
      .sort((a, b) => new Date(a[1].startTime).getTime() - new Date(b[1].startTime).getTime())

    // Build chart data
    return sortedRuns.map(([runId, { srcRunId: _srcRunId, startTime }]) => {
      const dataPoint: Record<string, unknown> = {
        runId,
        name: format(new Date(startTime), "MMM d HH:mm"),
        fullDate: format(new Date(startTime), "MMM d, yyyy HH:mm"),
      }

      // Add row count for each capture in this run
      for (const timeline of timelines) {
        const dp = timeline.dataPoints.find((d) => d.runId === runId)
        const key = getShortTaskId(timeline.captureId)
        dataPoint[key] = dp?.rowCount ?? null
      }

      return dataPoint
    })
  }, [timelines])

  // Get unique capture IDs for lines
  const captureKeys = useMemo(() => {
    return timelines.map((t) => getShortTaskId(t.captureId))
  }, [timelines])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Row Count Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Row Count Timeline</CardTitle>
          <CardDescription>Track row counts across DAG runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data metrics captured yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Row Count Timeline</CardTitle>
        <CardDescription>
          Row counts per task across recent runs
          {timelines.some((t) => t.upstream?.length) && (
            <span className="ml-2 text-xs text-muted-foreground">
              (Tasks with upstream dependencies are connected)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
                tickFormatter={formatNumber}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value, name) => {
                  if (value === null || value === undefined) return ["-", name]
                  return [formatNumber(Number(value)), name]
                }}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload as Record<string, unknown> | undefined
                  return item?.fullDate as string ?? label
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
              {captureKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
