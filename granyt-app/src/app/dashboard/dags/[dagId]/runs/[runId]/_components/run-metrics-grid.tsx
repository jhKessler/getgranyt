"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatDuration } from "@/lib/format"
import { Clock, CheckCircle2, AlertCircle, Database } from "lucide-react"

interface RunMetricsGridProps {
  run: {
    duration: number | null
    tasks: {
      status: string
    }[]
    captures: {
      metrics: Record<string, unknown>
    }[]
  }
  alertsCount: number
}

// Extract row_count from metrics JSON
function getRowCount(metrics: Record<string, unknown>): number {
  const val = metrics.row_count
  if (typeof val === "number") return val
  return 0
}

export function RunMetricsGrid({ run, alertsCount }: RunMetricsGridProps) {
  const totalTasks = run.tasks.length
  const successfulTasks = run.tasks.filter(t => t.status.toLowerCase() === "success").length
  const successRate = totalTasks > 0 ? Math.round((successfulTasks / totalTasks) * 100) : 0
  
  const totalRows = run.captures.reduce((acc, c) => acc + getRowCount(c.metrics), 0)
  
  const formatRows = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Duration"
        value={formatDuration(run.duration)}
        icon={Clock}
        description="Total execution time"
      />
      <MetricCard
        title="Task Success"
        value={`${successfulTasks}/${totalTasks}`}
        icon={CheckCircle2}
        description={`${successRate}% success rate`}
      />
      <MetricCard
        title="Alerts"
        value={alertsCount.toString()}
        icon={AlertCircle}
        description={alertsCount === 0 ? "No alerts detected" : "Alerts detected"}
      />
      <MetricCard
        title="Data Volume"
        value={formatRows(totalRows)}
        icon={Database}
        description="Total rows processed"
      />
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  description
}: { 
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
