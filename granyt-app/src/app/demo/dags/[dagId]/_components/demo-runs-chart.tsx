"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { format } from "date-fns"
import { Timeframe } from "@/server/services/dashboard/types"
import { getRunStatusChartColor } from "@/lib/status-colors"
import { Activity } from "lucide-react"

interface DemoRunsChartProps {
  dagId: string
  environment?: string | null
  timeframe: Timeframe
  data: {
    startTime: string | Date
    duration?: number
    status: string
    srcRunId: string
    [key: string]: unknown
  }[]
}

const BUILTIN_METRICS = [
  { id: "duration", label: "Duration", unit: "s" },
] as const

export function DemoRunsChart({ dagId, environment: _environment, timeframe: _timeframe, data }: DemoRunsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>("duration")

  const chartData = useMemo(() => {
    return data.map((run) => ({
      name: format(new Date(run.startTime), "MMM dd HH:mm"),
      fullDate: format(new Date(run.startTime), "PPP p"),
      value: selectedMetric === "duration" ? (run.duration || 0) / 1000 : (run[selectedMetric] as number) || 0,
      status: run.status,
      runId: run.srcRunId,
    }))
  }, [data, selectedMetric])

  const metricLabel = BUILTIN_METRICS.find(m => m.id === selectedMetric)?.label || selectedMetric

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle>Run History</CardTitle>
          <CardDescription>
            {metricLabel} over time for {dagId}
          </CardDescription>
        </div>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select metric" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {BUILTIN_METRICS.map((metric) => (
              <SelectItem key={metric.id} value={metric.id}>
                {metric.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" opacity={0.1} />
              <XAxis
                dataKey="name"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}${BUILTIN_METRICS.find(m => m.id === selectedMetric)?.unit || ""}`}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Date
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {data.fullDate}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {metricLabel}
                            </span>
                            <span className="font-bold">
                              {data.value}{BUILTIN_METRICS.find(m => m.id === selectedMetric)?.unit || ""}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Status
                            </span>
                            <span className="font-bold capitalize" style={{ color: getRunStatusChartColor(data.status) }}>
                              {data.status}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Run ID
                            </span>
                            <span className="font-mono text-[0.70rem]">
                              {data.runId}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <LabelList 
                  dataKey="value" 
                  position="top" 
                  fontSize={10} 
                  formatter={(val: number) => val > 0 ? `${val}${BUILTIN_METRICS.find(m => m.id === selectedMetric)?.unit || ""}` : ""}
                  className="fill-muted-foreground"
                />
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRunStatusChartColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
