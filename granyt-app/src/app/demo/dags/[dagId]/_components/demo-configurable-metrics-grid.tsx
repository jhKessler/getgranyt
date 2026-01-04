"use client"

import { Activity, CheckCircle, Database } from "lucide-react"
import { MetricCard } from "@/components/shared"
import { Timeframe } from "@/server/services/dashboard/types"

interface DemoConfigurableMetricsGridProps {
  dagId: string
  environment?: string | null
  timeframe: Timeframe
  data: {
    totalRuns: number
    successRate: number
    avgDuration: number
    avgRows: number
  }
}

// Format numeric values for display
function formatValue(value: number | null, isPercentage = false): string {
  if (value === null) return "N/A"
  if (isPercentage) return `${value.toFixed(1)}%`
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  if (Number.isInteger(value)) return value.toLocaleString()
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function DemoConfigurableMetricsGrid({
  data,
}: DemoConfigurableMetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Runs"
        value={formatValue(data.totalRuns)}
        tooltip="Total number of DAG runs"
        icon={Activity}
        isLoading={false}
      />
      <MetricCard
        title="Success Rate"
        value={formatValue(data.successRate, true)}
        tooltip="Percentage of successful runs"
        icon={CheckCircle}
        isLoading={false}
      />
      <MetricCard
        title="Avg Duration"
        value={`${(data.avgDuration / 1000).toFixed(1)}s`}
        tooltip="Average duration per run"
        icon={Activity}
        isLoading={false}
      />
      <MetricCard
        title="Avg Rows"
        value={formatValue(data.avgRows)}
        tooltip="Average rows processed per run"
        icon={Database}
        isLoading={false}
      />
    </div>
  )
}
