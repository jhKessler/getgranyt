"use client"

import { useState } from "react"
import { Activity, AlertTriangle, BarChart3, Clock } from "lucide-react"
import { PageHeader, MetricCard } from "@/components/shared"
import { Timeframe } from "@/server/services/dashboard/types"
import { 
  mockMetrics, 
  mockRunStats, 
  mockAlerts, 
  mockAlertsSummary, 
  mockRecentErrors,
  mockEnvironments,
} from "./_data/mock-data"
import { 
  DagRunsChart,
  NotificationsCard,
  RecentErrorsCard,
  TimeframeSwitcher,
} from "@/app/dashboard/_components"
import { DemoEnvironmentSwitcher } from "./_components"

export default function DemoDashboardPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.Week)
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null)

  const timeframeDesc = getTimeframeDescription(timeframe)
  const currentMetrics = mockMetrics[timeframe]

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Dashboard"
          description={`Overview of your DAGs ${timeframeDesc}`}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <TimeframeSwitcher 
            value={timeframe}
            onChange={setTimeframe}
            className="flex-1 sm:flex-none sm:w-[180px]"
          />
          <DemoEnvironmentSwitcher 
            selectedEnvironment={selectedEnvironment}
            onEnvironmentChange={setSelectedEnvironment}
            environments={mockEnvironments}
            className="flex-1 sm:flex-none sm:w-[180px]"
          />
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Runs"
          value={currentMetrics.totalRuns}
          description={`DAG runs ${timeframeDesc}`}
          tooltip="Total number of DAG executions across all DAGs in the selected timeframe"
          icon={BarChart3}
          isLoading={false}
        />
        <MetricCard
          title="Unique DAGs"
          value={currentMetrics.activeDags}
          description="DAGs with recent activity"
          tooltip="Count of unique DAGs that have executed at least one run in the selected timeframe"
          icon={Activity}
          isLoading={false}
        />
        <MetricCard
          title="Failed Runs"
          value={currentMetrics.failedRuns}
          description={`Failed runs ${timeframeDesc}`}
          tooltip="Number of DAG runs that ended with an error or exception"
          icon={AlertTriangle}
          isLoading={false}
          variant={currentMetrics.failedRuns > 0 ? "destructive" : "default"}
        />
        <MetricCard
          title="Rows Processed"
          value={currentMetrics.rowsProcessed.toLocaleString()}
          description={`Data rows handled ${timeframeDesc}`}
          tooltip="Total number of data rows captured across all DAG runs using the Granyt SDK"
          icon={Clock}
          isLoading={false}
        />
      </div>

      <DagRunsChart 
        data={mockRunStats[timeframe]} 
        timeframe={timeframe} 
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <NotificationsCard 
          alerts={mockAlerts.slice(0, 1)}
          summary={mockAlertsSummary[timeframe]}
          isLoading={false}
          basePath="/demo"
        />
        <RecentErrorsCard 
          errors={mockRecentErrors.slice(0, 1)} 
          isLoading={false}
          basePath="/demo"
        />
      </div>
    </div>
  )
}

function getTimeframeDescription(timeframe: Timeframe): string {
  switch (timeframe) {
    case Timeframe.Day:
      return "in the last 24 hours"
    case Timeframe.Week:
      return "in the last 7 days"
    case Timeframe.Month:
      return "in the last 28 days"
    case Timeframe.AllTime:
      return "all time"
  }
}
