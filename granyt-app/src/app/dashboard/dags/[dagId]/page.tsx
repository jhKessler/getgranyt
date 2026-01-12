"use client"

import { use, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { useEnvironment } from "@/lib/environment-context"
import { useDocumentTitle } from "@/lib/use-document-title"
import { Timeframe } from "@/server/services/dashboard/types"
import {
  DagDetailHeader,
  EnvironmentBreadcrumb,
  RunsChart,
  RunsTable,
  ConfigurableMetricsGrid,
} from "./_components"
import { NotificationsCard, RecentErrorsCard, RecentError } from "../../_components"

export default function DagDetailPage({ params }: { params: Promise<{ dagId: string }> }) {
  const resolvedParams = use(params)
  const dagId = decodeURIComponent(resolvedParams.dagId)
  const searchParams = useSearchParams()
  const envFromUrl = searchParams.get("env")
  useDocumentTitle(dagId, "DAG")
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.Week)
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null)
  const [metricsKey, setMetricsKey] = useState(0)
  const { defaultEnvironment, getAirflowUrl } = useEnvironment()

  // Force re-fetch of metrics when settings change
  const handleMetricsSettingsChange = () => {
    setMetricsKey((prev) => prev + 1)
  }

  // Fetch environment statuses for this DAG
  const { data: envStatuses, isLoading: _envStatusesLoading } = trpc.dashboard.getDagEnvironmentStatuses.useQuery({
    dagId,
    timeframe,
  })

  // Set initial environment when data loads - prefer URL param, then default environment
  useEffect(() => {
    if (envStatuses && envStatuses.length > 0 && selectedEnv === null) {
      // Priority: URL param > default environment > first available
      const urlEnv = envFromUrl ? envStatuses.find(e => e.environment === envFromUrl) : null
      const defaultEnv = envStatuses.find(e => e.environment === defaultEnvironment)
      setSelectedEnv(urlEnv?.environment ?? defaultEnv?.environment ?? envStatuses[0].environment)
    }
  }, [envStatuses, selectedEnv, defaultEnvironment, envFromUrl])

  // Environment-agnostic data (all environments)
  const { data: allEnvErrors, isLoading: _allErrorsLoading } = trpc.dashboard.getRecentErrors.useQuery({
    limit: 10,
    // No environment filter - gets all
  })

  // Filter errors to only those affecting this DAG
  const { data: dagDetailsAll } = trpc.dashboard.getDagDetails.useQuery({
    dagId,
    timeframe,
    // No environment filter
  })
  const dagErrorIds = new Set((dagDetailsAll?.errors ?? []).map((e: { id: string }) => e.id))
  const _dagErrors = (allEnvErrors ?? []).filter(e => dagErrorIds.has(e.id))

  // Environment-specific data
  const { data: dagDetails, isLoading: detailsLoading } = trpc.dashboard.getDagDetails.useQuery({
    dagId,
    timeframe,
    environment: selectedEnv ?? undefined,
  }, {
    enabled: !!selectedEnv,
  })

  const { data: runs, isLoading: runsLoading } = trpc.dashboard.getDagRuns.useQuery({
    dagId,
    timeframe,
    limit: 50,
    environment: selectedEnv ?? undefined,
  }, {
    enabled: !!selectedEnv,
  })

  // Open alerts for this DAG
  const { data: openAlerts, isLoading: alertsLoading } = trpc.alerts.getAlerts.useQuery({
    srcDagId: dagId,
    status: "OPEN",
    limit: 10,
  })

  // Fetch dag runs with open alerts
  const { data: runAlerts } = trpc.alerts.getDagRunsWithAlerts.useQuery({})

  // Get Airflow URL for the selected environment
  const airflowUrl = getAirflowUrl(selectedEnv)

  const _hasMultipleEnvs = (envStatuses?.length ?? 0) > 1

  // Map DAG errors to RecentError format
  const mappedErrors: RecentError[] = (dagDetails?.errors ?? []).map((e) => ({
    id: e.id,
    exceptionType: e.exceptionType,
    message: e.message,
    occurrenceCount: e.occurrenceCount,
    dagCount: 1,
    lastSeenAt: e.lastSeenAt,
    firstSeenAt: e.lastSeenAt, // Fallback
    status: "OPEN",
    environments: selectedEnv ? [selectedEnv] : [],
  }))

  return (
    <div className="space-y-6">
      <DagDetailHeader
        dagId={dagId}
        localEnv={selectedEnv}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onMetricsSettingsChange={handleMetricsSettingsChange}
        airflowUrl={airflowUrl}
      />

      {/* Environment-specific section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Environment Details</h2>
          <EnvironmentBreadcrumb
            statuses={envStatuses ?? []}
            selectedEnv={selectedEnv}
            onSelectEnv={setSelectedEnv}
          />
        </div>
      </div>

      <ConfigurableMetricsGrid
        key={metricsKey}
        dagId={dagId}
        environment={selectedEnv}
        timeframe={timeframe}
      />

      {/* Errors and Alerts side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NotificationsCard
          alerts={openAlerts ?? []}
          isLoading={alertsLoading}
          showViewAll={false}
        />
        <RecentErrorsCard
          title={`${selectedEnv ? selectedEnv.charAt(0).toUpperCase() + selectedEnv.slice(1) : ""} Errors`}
          description={`Errors in ${selectedEnv ?? "selected"} environment`}
          errors={mappedErrors}
          isLoading={detailsLoading}
          showViewAll={false}
        />
      </div>

      <RunsChart
        dagId={dagId}
        environment={selectedEnv}
        timeframe={timeframe}
      />

      <RunsTable
        dagId={dagId}
        runs={runs}
        isLoading={runsLoading}
        showEnvironment={false}
        runAlerts={runAlerts}
      />
    </div>
  )
}
