"use client"

import { Activity, CheckCircle, XCircle, TrendingUp } from "lucide-react"
import { MetricCard } from "@/components/shared"
import { trpc } from "@/lib/trpc"
import { Timeframe } from "@/server/services/dashboard/types"
import {
  MetricType,
  Aggregation,
  BUILTIN_METRICS,
  type MetricConfig,
  type ComputedMetricsData,
} from "@/server/services/dag-metrics/types"

interface ConfigurableMetricsGridProps {
  dagId: string
  environment?: string | null
  timeframe: Timeframe
  settings?: {
    selectedMetrics: (MetricConfig & { enabled: boolean; order: number })[]
  }
  computedMetrics?: ComputedMetricsData | null
  isLoading?: boolean
}

// Map metric IDs to icons
const METRIC_ICONS: Record<string, typeof Activity> = {
  total_runs: Activity,
  success_rate: CheckCircle,
  successful_runs: CheckCircle,
  failed_runs: XCircle,
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

// Get value from computed metrics based on metric config
function getMetricValue(
  metric: MetricConfig,
  data: ComputedMetricsData | null
): { value: string; tooltip: string } {
  if (!data) {
    return { value: "-", tooltip: "No data available" }
  }

  // Builtin metrics
  if (metric.type === MetricType.Builtin) {
    switch (metric.id) {
      case "total_runs":
        return {
          value: formatValue(data.totalRuns),
          tooltip: "Total number of DAG runs",
        }
      case "success_rate":
        return {
          value: formatValue(data.successRate, true),
          tooltip: "Percentage of successful runs",
        }
      case "successful_runs":
        return {
          value: formatValue(data.successfulRuns),
          tooltip: "Number of successful runs",
        }
      case "failed_runs":
        return {
          value: formatValue(data.failedRuns),
          tooltip: "Number of failed runs",
        }
    }
  }

  // Custom metrics (from Metric.metrics JSON)
  if (metric.type === MetricType.Custom && data.customMetrics) {
    // Extract metric name from id: "custom:name:agg"
    const parts = metric.id.split(":")
    if (parts.length >= 3) {
      const metricName = parts[1]
      const agg = data.customMetrics[metricName]
      if (agg) {
        if (metric.aggregation === Aggregation.Avg) {
          const avg = agg.count > 0 ? agg.sum / agg.count : null
          return {
            value: formatValue(avg),
            tooltip: `Average ${metricName.replace(/_/g, " ")} per run`,
          }
        } else if (metric.aggregation === Aggregation.Last) {
          return {
            value: formatValue(agg.lastValue ?? null),
            tooltip: `Last ${metricName.replace(/_/g, " ")} value`,
          }
        } else {
          return {
            value: formatValue(agg.sum),
            tooltip: `Total ${metricName.replace(/_/g, " ")} across all runs`,
          }
        }
      }
    }
  }

  return { value: "-", tooltip: "Metric not available" }
}

// Get label for a metric
function getMetricLabel(metric: MetricConfig): string {
  const builtin = BUILTIN_METRICS.find((b) => b.id === metric.id)
  if (builtin) return builtin.label

  const parts = metric.id.split(":")
  if (parts.length >= 2) {
    const name = parts[1]
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
    if (metric.aggregation === Aggregation.Avg) {
      return `Avg ${name}`
    } else if (metric.aggregation === Aggregation.Total) {
      return `Total ${name}`
    } else if (metric.aggregation === Aggregation.Last) {
      return `Last ${name}`
    }
    return name
  }

  return metric.id
}

// Get icon for a metric
function getMetricIcon(metric: MetricConfig): typeof Activity {
  if (METRIC_ICONS[metric.id]) return METRIC_ICONS[metric.id]
  
  // Default icons by type
  if (metric.type === MetricType.Custom) return TrendingUp
  
  return Activity
}

export function ConfigurableMetricsGrid({
  dagId,
  environment,
  timeframe,
  settings: propSettings,
  computedMetrics: propComputedMetrics,
  isLoading: propLoading,
}: ConfigurableMetricsGridProps) {
  // Fetch user's metric settings
  const { data: contextSettings, isLoading: settingsLoading } =
    trpc.dagMetrics.getSettings.useQuery({ dagId }, { enabled: !propSettings })

  // Fetch computed metrics
  const { data: contextComputedMetrics, isLoading: metricsLoading } =
    trpc.dagMetrics.getComputedMetrics.useQuery({
      dagId,
      environment,
      timeframe,
    }, { enabled: !propComputedMetrics })

  const settings = propSettings ?? contextSettings
  const computedMetrics = propComputedMetrics ?? contextComputedMetrics
  const isLoading = propLoading ?? (settingsLoading || metricsLoading)

  // Get enabled metrics sorted by order
  const enabledMetrics = (settings?.selectedMetrics ?? [])
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order)

  if (enabledMetrics.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {enabledMetrics.map((metric) => {
        const { value, tooltip } = getMetricValue(metric, computedMetrics ?? null)
        const Icon = getMetricIcon(metric)

        return (
          <MetricCard
            key={metric.id}
            title={getMetricLabel(metric)}
            value={value}
            tooltip={tooltip}
            icon={Icon}
            isLoading={isLoading}
          />
        )
      })}
    </div>
  )
}
