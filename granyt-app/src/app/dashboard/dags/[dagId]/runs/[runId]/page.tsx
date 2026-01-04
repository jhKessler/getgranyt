"use client"

import { use } from "react"
import { trpc } from "@/lib/trpc"
import { useDocumentTitle } from "@/lib/use-document-title"
import { Skeleton } from "@/components/ui/skeleton"
import { RunMetadataHeader } from "./_components/run-metadata-header"
import { RunMetricsGrid } from "./_components/run-metrics-grid"
import { TaskGraph } from "./_components/task-graph"
import { TaskMetrics } from "./_components/task-metrics"
import { NotificationsCard, RecentErrorsCard, RecentError } from "../../../../_components"

export default function RunDetailPage({ 
  params 
}: { 
  params: Promise<{ dagId: string; runId: string }> 
}) {
  const resolvedParams = use(params)
  const dagId = decodeURIComponent(resolvedParams.dagId)
  const runId = decodeURIComponent(resolvedParams.runId)

  const { data: runDetails, isLoading } = trpc.dashboard.getRunDetails.useQuery({
    runId,
  })

  // Alerts for this specific run
  const { data: runAlerts, isLoading: alertsLoading } = trpc.alerts.getAlerts.useQuery({
    dagRunId: runId,
    limit: 10,
    status: "OPEN",
  })

  // Find the first error ID from failed tasks
  const failedTaskErrorId = runDetails?.tasks.find(task => task.errorId)?.errorId ?? null

  // Fetch error details if there's a failed task
  const { data: errorDetails, isLoading: errorLoading } = trpc.dashboard.getErrorDetails.useQuery({
    errorId: failedTaskErrorId!,
  }, {
    enabled: !!failedTaskErrorId,
  })

  // Map error to RecentError format
  const mappedErrors: RecentError[] = errorDetails ? [{
    id: errorDetails.id,
    exceptionType: errorDetails.exceptionType,
    message: errorDetails.message,
    occurrenceCount: errorDetails.occurrenceCount,
    dagCount: 1,
    lastSeenAt: errorDetails.lastSeenAt,
    firstSeenAt: errorDetails.firstSeenAt,
    status: errorDetails.status,
    environments: runDetails?.environment ? [runDetails.environment] : [],
  }] : []

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
      
      {/* Errors and Alerts side by side - same as pipeline page */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NotificationsCard
          alerts={runAlerts ?? []}
          isLoading={alertsLoading}
          showViewAll={false}
        />
        <RecentErrorsCard
          title="Run Errors"
          description="Errors from this run"
          errors={mappedErrors}
          isLoading={errorLoading && !!failedTaskErrorId}
          showViewAll={false}
        />
      </div>
      
      <TaskGraph tasks={runDetails.tasks} runStartTime={runDetails.startTime} />
      <TaskMetrics captures={runDetails.captures} tasks={runDetails.tasks} />
    </div>
  )
}
