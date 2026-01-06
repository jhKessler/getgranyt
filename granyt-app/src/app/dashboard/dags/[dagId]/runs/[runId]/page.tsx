"use client"

import { use, useEffect } from "react"
import { trpc } from "@/lib/trpc"
import { useDocumentTitle } from "@/lib/use-document-title"
import { useBreadcrumbContext } from "@/lib/breadcrumb-context"
import { Skeleton } from "@/components/ui/skeleton"
import { RunMetadataHeader } from "./_components/run-metadata-header"
import { RunMetricsGrid } from "./_components/run-metrics-grid"
import { TaskGraph } from "./_components/task-graph"
import { TaskMetrics } from "./_components/task-metrics"
import { RunStacktraceCard } from "./_components/run-stacktrace-card"
import { NotificationsCard } from "../../../../_components"

export default function RunDetailPage({ 
  params 
}: { 
  params: Promise<{ dagId: string; runId: string }> 
}) {
  const resolvedParams = use(params)
  const dagId = decodeURIComponent(resolvedParams.dagId)
  const runId = decodeURIComponent(resolvedParams.runId)
  const { setOverride, clearOverride } = useBreadcrumbContext()

  const { data: runDetails, isLoading } = trpc.dashboard.getRunDetails.useQuery({
    runId,
  })

  // Set breadcrumb override when srcRunId is available
  useEffect(() => {
    if (runDetails?.srcRunId) {
      setOverride(runId, runDetails.srcRunId)
    }
    return () => {
      clearOverride(runId)
    }
  }, [runDetails?.srcRunId, runId, setOverride, clearOverride])

  // Alerts for this specific run
  const { data: runAlerts, isLoading: alertsLoading } = trpc.alerts.getAlerts.useQuery({
    dagRunId: runId,
    limit: 10,
    status: "OPEN",
  })

  // Fetch error occurrences with stacktraces for this run
  const errorOccurrencesQuery = trpc.dashboard.getRunErrorOccurrences.useQuery({
    dagRunId: runId,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorOccurrences = errorOccurrencesQuery.data as any[] | undefined

  // Format run ID for display (extract timestamp if it's a scheduled run)
  const displayRunId = runId.includes("__") 
    ? runId.split("__")[1]?.substring(0, 19).replace("T", " ") || runId.substring(0, 20)
    : runId.substring(0, 20)
  useDocumentTitle(`${dagId} @ ${displayRunId}`, "Run")

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!runDetails) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Run not found</h2>
          <p className="text-muted-foreground">The requested run could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <RunMetadataHeader run={runDetails} dagId={dagId} />
      <RunMetricsGrid run={runDetails} alertsCount={runAlerts?.length ?? 0} />
      
      {/* Error Stacktraces - show if there are errors */}
      {errorOccurrences && errorOccurrences.length > 0 && (
        <RunStacktraceCard occurrences={errorOccurrences} />
      )}
      
      {/* Alerts */}
      {(runAlerts && runAlerts.length > 0) && (
        <NotificationsCard
          alerts={runAlerts}
          isLoading={alertsLoading}
          showViewAll={false}
        />
      )}
      
      <TaskGraph tasks={runDetails.tasks} runStartTime={runDetails.startTime} />
      <TaskMetrics captures={runDetails.captures} tasks={runDetails.tasks} />
    </div>
  )
}
