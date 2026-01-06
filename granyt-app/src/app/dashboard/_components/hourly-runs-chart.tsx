"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, LabelList } from "recharts"
import { format, addHours, addDays } from "date-fns"
import { HelpCircle, Activity } from "lucide-react"
import { STATUS_CHART_COLORS } from "@/lib/status-colors"
import { Timeframe, RunStatusFilter } from "@/server/services/dashboard/types"

type ChartGrouping = "runs" | "success" | "failed" | "manual" | "scheduled"

interface RunData {
  date: string
  success: number
  failed: number
  manual: number
  scheduled: number
}

interface DagRunsChartProps {
  data: RunData[]
  timeframe: Timeframe
  isLoading?: boolean
  onBarClick?: (startTime: Date, endTime: Date, status: RunStatusFilter) => void
}

function getChartTitle(timeframe: Timeframe, grouping: ChartGrouping): string {
  let metric = "DAG Runs"
  if (grouping === "success") metric = "Successful Runs"
  if (grouping === "failed") metric = "Failed Runs"
  if (grouping === "manual") metric = "Manual Runs"
  if (grouping === "scheduled") metric = "Scheduled Runs"

  switch (timeframe) {
    case Timeframe.Day:
      return `${metric} (Last 24 Hours)`
    case Timeframe.Week:
      return `${metric} (Last 7 Days)`
    case Timeframe.Month:
      return `${metric} (Last 28 Days)`
    case Timeframe.AllTime:
      return `${metric} (All Time)`
  }
}

function getChartDescription(timeframe: Timeframe, grouping: ChartGrouping): string {
  const period = timeframe === Timeframe.Day ? "Hourly" : "Daily"
  if (grouping === "success") {
    return `${period} breakdown of successful DAG runs`
  }
  if (grouping === "failed") {
    return `${period} breakdown of failed DAG runs`
  }
  if (grouping === "manual") {
    return `${period} breakdown of manually triggered DAG runs`
  }
  if (grouping === "scheduled") {
    return `${period} breakdown of scheduled DAG runs`
  }
  return `${period} breakdown of all DAG runs`
}

function getTooltipText(timeframe: Timeframe, grouping: ChartGrouping): string {
  const period = timeframe === Timeframe.Day ? "past 24 hours, aggregated by hour" : "selected timeframe, aggregated by day"
  if (grouping === "success") {
    return `Shows the number of successful DAG runs over the ${period}.`
  }
  if (grouping === "failed") {
    return `Shows the number of failed DAG runs over the ${period}.`
  }
  if (grouping === "manual") {
    return `Shows the number of manually triggered DAG runs over the ${period}.`
  }
  if (grouping === "scheduled") {
    return `Shows the number of scheduled DAG runs over the ${period}.`
  }
  return `Shows the total number of DAG runs over the ${period}.`
}

function formatDate(date: string, timeframe: Timeframe): string {
  const d = new Date(date)
  if (timeframe === Timeframe.Day) {
    return format(d, "HH:mm")
  }
  return format(d, "MMM d")
}

export function DagRunsChart({ data, timeframe, isLoading = false, onBarClick }: DagRunsChartProps) {
  const [grouping, setGrouping] = useState<ChartGrouping>("runs")

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">{getChartTitle(timeframe, "runs")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[160px] sm:h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    date: formatDate(item.date, timeframe),
    originalDate: item.date,
    "All Runs": item.success + item.failed,
    "Successful Runs": item.success,
    "Failed Runs": item.failed,
    "Manual Runs": item.manual,
    "Scheduled Runs": item.scheduled,
  }))

  const handleBarClick = (data: { originalDate?: string }) => {
    if (!onBarClick || !data.originalDate) return
    const startTime = new Date(data.originalDate)
    // End time is +1 hour for daily view, +1 day for weekly/monthly view
    const endTime = timeframe === Timeframe.Day
      ? addHours(startTime, 1)
      : addDays(startTime, 1)
    // Map grouping to status filter
    const status = grouping === "success" 
      ? RunStatusFilter.Success 
      : grouping === "failed" 
        ? RunStatusFilter.Failed 
        : RunStatusFilter.All
    onBarClick(startTime, endTime, status)
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg">{getChartTitle(timeframe, grouping)}</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px]">
                <p>{getTooltipText(timeframe, grouping)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={grouping} onValueChange={(v) => setGrouping(v as ChartGrouping)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="runs">All DAG Runs</SelectItem>
              <SelectItem value="success">Successful Runs</SelectItem>
              <SelectItem value="failed">Failed Runs</SelectItem>
              <SelectItem value="manual">Manual Runs</SelectItem>
              <SelectItem value="scheduled">Scheduled Runs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription className="text-xs sm:text-sm">{getChartDescription(timeframe, grouping)}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[160px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={40}
              />
              <RechartsTooltip 
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const value = payload[0].value as number
                    const name = payload[0].name as string
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.70rem] uppercase text-muted-foreground font-medium">
                            {data.fullDate || data.date}
                          </span>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: payload[0].fill }}
                            />
                            <span className="font-bold text-sm">
                              {value} {name}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {grouping === "runs" && (
                <Bar 
                  dataKey="All Runs" 
                  fill={STATUS_CHART_COLORS.running} 
                  radius={[4, 4, 0, 0]}
                  cursor={onBarClick ? "pointer" : undefined}
                  onClick={(data) => handleBarClick(data)}
                >
                  <LabelList 
                    dataKey="All Runs" 
                    position="top" 
                    fontSize={10} 
                    formatter={(val: number) => val > 0 ? val : ""}
                    className="fill-muted-foreground"
                  />
                </Bar>
              )}
              {grouping === "success" && (
                <Bar 
                  dataKey="Successful Runs" 
                  fill={STATUS_CHART_COLORS.success} 
                  radius={[4, 4, 0, 0]}
                  cursor={onBarClick ? "pointer" : undefined}
                  onClick={(data) => handleBarClick(data)}
                >
                  <LabelList 
                    dataKey="Successful Runs" 
                    position="top" 
                    fontSize={10} 
                    formatter={(val: number) => val > 0 ? val : ""}
                    className="fill-muted-foreground"
                  />
                </Bar>
              )}
              {grouping === "failed" && (
                <Bar 
                  dataKey="Failed Runs" 
                  fill={STATUS_CHART_COLORS.failed} 
                  radius={[4, 4, 0, 0]}
                  cursor={onBarClick ? "pointer" : undefined}
                  onClick={(data) => handleBarClick(data)}
                >
                  <LabelList 
                    dataKey="Failed Runs" 
                    position="top" 
                    fontSize={10} 
                    formatter={(val: number) => val > 0 ? val : ""}
                    className="fill-muted-foreground"
                  />
                </Bar>
              )}
              {grouping === "manual" && (
                <Bar 
                  dataKey="Manual Runs" 
                  fill={STATUS_CHART_COLORS.running} 
                  radius={[4, 4, 0, 0]}
                  cursor={onBarClick ? "pointer" : undefined}
                  onClick={(data) => handleBarClick(data)}
                >
                  <LabelList 
                    dataKey="Manual Runs" 
                    position="top" 
                    fontSize={10} 
                    formatter={(val: number) => val > 0 ? val : ""}
                    className="fill-muted-foreground"
                  />
                </Bar>
              )}
              {grouping === "scheduled" && (
                <Bar 
                  dataKey="Scheduled Runs" 
                  fill={STATUS_CHART_COLORS.running} 
                  radius={[4, 4, 0, 0]}
                  cursor={onBarClick ? "pointer" : undefined}
                  onClick={(data) => handleBarClick(data)}
                >
                  <LabelList 
                    dataKey="Scheduled Runs" 
                    position="top" 
                    fontSize={10} 
                    formatter={(val: number) => val > 0 ? val : ""}
                    className="fill-muted-foreground"
                  />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
