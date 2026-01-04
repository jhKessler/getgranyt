"use client"

import { use, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NotificationsCard, RecentErrorsCard } from "@/app/dashboard/_components"
import { RunsTable, DagDetailHeader, EnvironmentBreadcrumb, ConfigurableMetricsGrid, RunsChart } from "@/app/dashboard/dags/[dagId]/_components"
import { Timeframe } from "@/server/services/dashboard/types"
import { MetricType } from "@/server/services/dag-metrics/types"
import { mockDagDetails, mockDags, mockAlerts, mockEnvironments } from "../../_data/mock-data"
import { ArrowLeft } from "lucide-react"

export default function DemoDagDetailPage({ 
  params 
}: { 
  params: Promise<{ dagId: string }> 
}) {
  const resolvedParams = use(params)
  const dagId = decodeURIComponent(resolvedParams.dagId)
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.Week)
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null)
  
  // Find the DAG in mock data
  const dagDetails = mockDagDetails[dagId]
  const dagOverview = mockDags.find(d => d.dagId === dagId)
  
  if (!dagDetails && !dagOverview) {
    return <DagNotFound />
  }
  
  const dag = dagDetails || {
    dagId,
    description: "Pipeline description not available",
    owner: "unknown",
    schedule: dagOverview?.schedule || null,
    lastStatus: dagOverview?.lastStatus || "unknown",
    successRate: dagOverview?.successRate || 0,
    totalRuns: dagOverview?.totalRuns || 0,
    avgDuration: dagOverview?.avgDuration || 0,
    avgRows: dagOverview?.avgRows || 0,
    recentRuns: [],
    errors: [],
    envStatuses: [{ environment: "production", lastStatus: dagOverview?.lastStatus || "unknown", lastRunTime: dagOverview?.lastRunTime || new Date().toISOString(), openErrorCount: 0, openAlertCount: 0 }],
  }

  // Set initial environment
  if (selectedEnv === null && dag.envStatuses.length > 0) {
    setSelectedEnv(dag.envStatuses[0].environment)
  }

  const filteredRuns = dag.recentRuns.filter(r => !selectedEnv || r.environment === selectedEnv)
  
  // Map runs to match the RunsTable interface (runId instead of srcRunId)
  const mappedRuns = filteredRuns.map(r => ({
    id: r.id,
    runId: r.srcRunId,
    status: r.status,
    startTime: r.startTime,
    duration: r.duration,
    rowsProcessed: r.rowsProcessed,
    runType: r.runType,
    environment: r.environment,
  }))
  
  const filteredAlerts = mockAlerts.filter(a => a.srcDagId === dagId && (!selectedEnv || a.environment === selectedEnv))
  const mappedErrors = dag.errors
    .filter(e => !selectedEnv || (e.environments && e.environments.includes(selectedEnv)))
    .map(e => ({
      id: e.id,
      exceptionType: e.exceptionType,
      message: e.message,
      occurrenceCount: e.occurrenceCount,
      dagCount: 1,
      lastSeenAt: e.lastSeenAt,
      firstSeenAt: e.lastSeenAt,
      status: "OPEN",
    }))

  // Mock environment-specific metrics
  const envMetrics = selectedEnv === "staging" ? {
    totalRuns: Math.floor(dag.totalRuns * 0.3),
    successRate: dag.successRate - 5,
    avgDuration: dag.avgDuration * 1.1,
    avgRows: Math.floor(dag.avgRows * 0.8),
  } : {
    totalRuns: dag.totalRuns,
    successRate: dag.successRate,
    avgDuration: dag.avgDuration,
    avgRows: dag.avgRows,
  }

  return (
    <div className="space-y-6">
      <DagDetailHeader 
        dagId={dag.dagId}
        localEnv={selectedEnv}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        basePath="/demo"
        showSettings={false}
      />

      {/* Environment-specific section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Environment Details</h2>
          <EnvironmentBreadcrumb 
            statuses={dag.envStatuses}
            selectedEnv={selectedEnv}
            onSelectEnv={setSelectedEnv}
            environments={mockEnvironments}
          />
        </div>
      </div>

      <ConfigurableMetricsGrid
        dagId={dag.dagId}
        environment={selectedEnv}
        timeframe={timeframe}
        isLoading={false}
        settings={{
          selectedMetrics: [
            { id: "total_runs", type: MetricType.Builtin, enabled: true, order: 0 },
            { id: "success_rate", type: MetricType.Builtin, enabled: true, order: 1 },
            { id: "avg_rows", type: MetricType.Builtin, enabled: true, order: 2 },
          ]
        }}
        computedMetrics={{
          totalRuns: envMetrics.totalRuns,
          successRate: envMetrics.successRate,
          successfulRuns: Math.floor(envMetrics.totalRuns * (envMetrics.successRate / 100)),
          failedRuns: Math.ceil(envMetrics.totalRuns * (1 - envMetrics.successRate / 100)),
          totalRows: Number(envMetrics.avgRows * envMetrics.totalRuns),
          avgRows: envMetrics.avgRows,
          totalDuration: envMetrics.avgDuration * envMetrics.totalRuns,
          avgDuration: envMetrics.avgDuration,
          customMetrics: {},
        }}
      />

      {/* Errors and Alerts side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NotificationsCard 
          alerts={filteredAlerts} 
          isLoading={false}
          showViewAll={false}
          basePath="/demo"
        />
        <RecentErrorsCard 
          title={`${selectedEnv ? selectedEnv.charAt(0).toUpperCase() + selectedEnv.slice(1) : ""} Errors`}
          description={`Errors in ${selectedEnv ?? "selected"} environment`}
          errors={mappedErrors}
          isLoading={false}
          showViewAll={false}
          basePath="/demo"
        />
      </div>

      <RunsChart
        dagId={dag.dagId}
        environment={selectedEnv}
        timeframe={timeframe}
        isLoading={false}
        basePath="/demo"
        snapshots={filteredRuns.map(r => ({
          id: r.id,
          duration: (r.duration || 0) / 1000, // Convert to seconds for the chart
          rowsProcessed: BigInt(r.rowsProcessed),
          taskCount: 10,
          errorCount: r.status === "failed" ? 1 : 0,
          successRate: r.status === "success" ? 100 : 0,
          customMetrics: {},
          dagRun: {
            id: r.id,
            srcRunId: r.srcRunId,
            status: r.status,
            startTime: r.startTime,
            runType: r.runType,
          }
        }))}
        availableMetrics={[]}
      />

      <RunsTable 
        dagId={dag.dagId}
        runs={mappedRuns}
        isLoading={false}
        basePath="/demo"
      />
    </div>
  )
}

function DagNotFound() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/demo/dags">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to DAGs
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">DAG not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This is a demo with limited data. Try one of the available DAGs.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
