"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { useEnvironment } from "@/lib/environment-context"
import { useDashboardFilters } from "@/lib/filters-context"
import { useDocumentTitle } from "@/lib/use-document-title"
import { formatDuration } from "@/lib/format"
import { RunStatusFilter } from "@/server/services/dashboard/types"
import { Activity, AlertTriangle, BarChart3, Clock } from "lucide-react"
import { PageHeader, MetricCard } from "@/components/shared"
import { 
  DagRunsChart, 
  NotificationsCard, 
  RecentErrorsCard,
  LocalEnvironmentSwitcher,
  TimeframeSwitcher,
  getTimeframeDescription,
} from "./_components"

export default function DashboardPage() {
  useDocumentTitle("Dashboard")
  const router = useRouter()
  const { defaultEnvironment, environments, isLoading: envsLoading } = useEnvironment()
  const { filters, setFilter, isHydrated } = useDashboardFilters()
  
  // Initialize with default environment only once after hydration
  useEffect(() => {
    if (isHydrated && !envsLoading && environments.length > 0 && !filters._envInitialized) {
      setFilter("selectedEnvironment", defaultEnvironment ?? environments[0]?.name ?? null)
      setFilter("_envInitialized", true)
    }
  }, [isHydrated, envsLoading, environments, defaultEnvironment, filters._envInitialized, setFilter])
  
  const selectedEnvironment = filters.selectedEnvironment
  const timeframe = filters.timeframe

  const { data: metrics, isLoading: metricsLoading } = trpc.dashboard.getOverviewMetrics.useQuery({ 
    timeframe,
    environment: selectedEnvironment ?? undefined,
  })
  
  const { data: runStats, isLoading: runStatsLoading } = trpc.dashboard.getRunStats.useQuery({ 
    timeframe,
    environment: selectedEnvironment ?? undefined,
  })
  
  const { data: recentErrors, isLoading: errorsLoading } = trpc.dashboard.getRecentErrors.useQuery({ 
    limit: 5,
    environment: selectedEnvironment ?? undefined,
  })

  const { data: alerts, isLoading: alertsLoading } = trpc.alerts.getAlerts.useQuery({
    status: "OPEN",
    limit: 5,
  })
  
  const { data: alertsSummary } = trpc.alerts.getAlertsSummary.useQuery({})

  const timeframeDesc = getTimeframeDescription(timeframe)

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Dashboard"
          description={`Overview of your DAGs ${timeframeDesc}`}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <TimeframeSwitcher 
            value={timeframe}
            onChange={(timeframe) => setFilter("timeframe", timeframe)}
            className="flex-1 sm:flex-none sm:w-[180px]"
          />
          <LocalEnvironmentSwitcher 
            selectedEnvironment={selectedEnvironment}
            onEnvironmentChange={(env) => setFilter("selectedEnvironment", env)}
            showAllOption={true}
            className="flex-1 sm:flex-none sm:w-[180px]"
          />
        </div>
      </div>

      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Runs"
          value={metrics?.totalRuns ?? 0}
          description={`DAG runs ${timeframeDesc}`}
          tooltip="Total number of DAG executions across all DAGs in the selected timeframe"
          icon={BarChart3}
          isLoading={metricsLoading}
          href={`/dashboard/runs?status=${RunStatusFilter.All}&timeframe=${timeframe}${selectedEnvironment ? `&environment=${selectedEnvironment}` : ""}`}
        />
        <MetricCard
          title="Unique DAGs"
          value={metrics?.activeDags ?? 0}
          description="DAGs with recent activity"
          tooltip="Count of unique DAGs that have executed at least one run in the selected timeframe"
          icon={Activity}
          isLoading={metricsLoading}
          href={`/dashboard/dags?timeframe=${timeframe}${selectedEnvironment ? `&environment=${selectedEnvironment}` : ""}`}
        />
        <MetricCard
          title="Failed Runs"
          value={metrics?.failedRuns ?? 0}
          description={`Failed runs ${timeframeDesc}`}
          tooltip="Number of DAG runs that ended with an error or exception"
          icon={AlertTriangle}
          isLoading={metricsLoading}
          variant={(metrics?.failedRuns ?? 0) > 0 ? "destructive" : "default"}
          href={`/dashboard/runs?status=${RunStatusFilter.Failed}&timeframe=${timeframe}${selectedEnvironment ? `&environment=${selectedEnvironment}` : ""}`}
        />
        <MetricCard
          title="Total Run Time"
          value={formatDuration(metrics?.totalDuration ?? 0)}
          description={`Combined DAG runtime ${timeframeDesc}`}
          tooltip="Sum of all DAG run durations in the selected timeframe"
          icon={Clock}
          isLoading={metricsLoading}
        />
      </div>

      <DagRunsChart 
        data={runStats || []} 
        timeframe={timeframe} 
        isLoading={runStatsLoading}
        onBarClick={(startTime, endTime, status) => {
          const params = new URLSearchParams()
          params.set("startTime", startTime.toISOString())
          params.set("endTime", endTime.toISOString())
          if (selectedEnvironment) params.set("environment", selectedEnvironment)
          params.set("status", status)
          router.push(`/dashboard/runs?${params.toString()}`)
        }}
      />

      <div className="grid gap-3 md:gap-4 lg:grid-cols-2">
        <NotificationsCard 
          alerts={alerts}
          summary={alertsSummary}
          isLoading={alertsLoading}
        />
        <RecentErrorsCard errors={recentErrors || []} isLoading={errorsLoading} />
      </div>
    </div>
  )
}
