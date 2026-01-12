"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { z } from "zod"
import { trpc } from "@/lib/trpc"
import { useEnvironment } from "@/lib/environment-context"
import { useDagsFilters } from "@/lib/filters-context"
import { useDocumentTitle } from "@/lib/use-document-title"
import { PageHeader, PageSkeleton } from "@/components/shared"
import { DagFilters, DagsTable } from "./_components"
import { RunStatusFilter, Timeframe } from "@/server/services/dashboard/types"

const urlParamsSchema = z.object({
  status: z.nativeEnum(RunStatusFilter).optional(),
  timeframe: z.nativeEnum(Timeframe).optional(),
  environment: z.string().optional(),
})

function DagsPageContent() {
  useDocumentTitle("DAGs")
  const searchParams = useSearchParams()
  const { environments, defaultEnvironment, isLoading: envsLoading, getAirflowUrl } = useEnvironment()
  const { filters, setFilter, isHydrated } = useDagsFilters()
  
  // Read filters from URL params on mount
  useEffect(() => {
    const parsed = urlParamsSchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      timeframe: searchParams.get("timeframe") ?? undefined,
      environment: searchParams.get("environment") ?? undefined,
    })
    
    if (!parsed.success) return
    
    if (parsed.data.status) {
      setFilter("statusFilter", parsed.data.status)
    }
    if (parsed.data.timeframe) {
      setFilter("timeframe", parsed.data.timeframe)
    }
    if (parsed.data.environment) {
      setFilter("selectedEnvironment", parsed.data.environment)
      setFilter("_envInitialized", true)
    }
  }, [searchParams, setFilter])

  // Initialize with first environment or default when loaded
  useEffect(() => {
    if (isHydrated && !envsLoading && environments.length > 0 && !filters._envInitialized) {
      setFilter("selectedEnvironment", defaultEnvironment ?? environments[0].name)
      setFilter("_envInitialized", true)
    }
  }, [isHydrated, environments, defaultEnvironment, envsLoading, filters._envInitialized, setFilter])

  const { data: dags, isLoading } = trpc.dashboard.getDagsOverview.useQuery({
    timeframe: filters.timeframe,
    search: filters.search || undefined,
    status: filters.statusFilter === RunStatusFilter.All ? undefined : filters.statusFilter,
    environment: filters.selectedEnvironment ?? undefined,
  }, {
    enabled: !!filters.selectedEnvironment,
  })

  // Fetch DAGs with open alerts
  const { data: dagAlerts } = trpc.alerts.getDagsWithAlerts.useQuery({})

  // Get Airflow URL for the selected environment
  const airflowUrl = getAirflowUrl(filters.selectedEnvironment)

  const _envLabel = filters.selectedEnvironment 
    ? filters.selectedEnvironment.charAt(0).toUpperCase() + filters.selectedEnvironment.slice(1)
    : ""

  return (
    <div className="space-y-6">
      <PageHeader 
        title="DAGs"
        description={`Overview of all your DAGs and their recent performance`}
      />

      <DagFilters
        search={filters.search}
        onSearchChange={(v) => setFilter("search", v)}
        timeframe={filters.timeframe}
        onTimeframeChange={(v) => setFilter("timeframe", v)}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={(v) => setFilter("statusFilter", v)}
        selectedEnvironment={filters.selectedEnvironment}
        onEnvironmentChange={(v) => setFilter("selectedEnvironment", v)}
        environments={environments}
        isEnvsLoading={envsLoading}
      />

      <DagsTable
        dags={dags}
        isLoading={isLoading || envsLoading || !isHydrated}
        selectedEnvironment={filters.selectedEnvironment}
        dagAlerts={dagAlerts}
        airflowUrl={airflowUrl}
      />
    </div>
  )
}

export default function DagsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DagsPageContent />
    </Suspense>
  )
}
