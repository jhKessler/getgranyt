"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { z } from "zod"
import { trpc } from "@/lib/trpc"
import { useEnvironment } from "@/lib/environment-context"
import { useRunsFilters } from "@/lib/filters-context"
import { useDocumentTitle } from "@/lib/use-document-title"
import { RunStatusFilter, Timeframe } from "@/server/services/dashboard/types"
import { PageHeader, PageSkeleton } from "@/components/shared"
import { RunsFilters, RunsTable } from "./_components"

const urlParamsSchema = z.object({
  status: z.nativeEnum(RunStatusFilter).optional(),
  timeframe: z.nativeEnum(Timeframe).optional(),
  environment: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
})

function RunsPageContent() {
  useDocumentTitle("Runs")
  const searchParams = useSearchParams()
  const { environments, defaultEnvironment, isLoading: envsLoading } = useEnvironment()
  const { filters, setFilter, isHydrated } = useRunsFilters()
  
  // Read filters from URL params on mount
  useEffect(() => {
    const parsed = urlParamsSchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      timeframe: searchParams.get("timeframe") ?? undefined,
      environment: searchParams.get("environment") ?? undefined,
      startTime: searchParams.get("startTime") ?? undefined,
      endTime: searchParams.get("endTime") ?? undefined,
    })
    
    if (!parsed.success) return
    
    if (parsed.data.status) {
      setFilter("statusFilter", parsed.data.status)
    }
    
    // Reset time filters first, then apply from URL
    setFilter("startTime", null)
    setFilter("endTime", null)
    
    if (parsed.data.timeframe) {
      setFilter("timeframe", parsed.data.timeframe)
    } else {
      // If timeframe is missing from URL, default to All Time
      setFilter("timeframe", Timeframe.AllTime)
    }

    if (parsed.data.environment) {
      setFilter("selectedEnvironment", parsed.data.environment)
      setFilter("_envInitialized", true)
    }
    // Handle custom date range
    if (parsed.data.startTime && parsed.data.endTime) {
      setFilter("startTime", parsed.data.startTime)
      setFilter("endTime", parsed.data.endTime)
    }
  }, [searchParams, setFilter])
  
  useEffect(() => {
    if (isHydrated && !envsLoading && environments.length > 0 && !filters._envInitialized) {
      setFilter("selectedEnvironment", defaultEnvironment ?? environments[0].name)
      setFilter("_envInitialized", true)
    }
  }, [isHydrated, environments, defaultEnvironment, envsLoading, filters._envInitialized, setFilter])

  const { data: runs, isLoading } = trpc.dashboard.getAllDagRuns.useQuery({
    timeframe: filters.timeframe,
    search: filters.search || undefined,
    status: filters.statusFilter === RunStatusFilter.All ? undefined : filters.statusFilter,
    runType: filters.runTypeFilter === "all" ? undefined : filters.runTypeFilter,
    environment: filters.selectedEnvironment ?? undefined,
    limit: 100,
    // Custom date range overrides timeframe
    startTime: filters.startTime ?? undefined,
    endTime: filters.endTime ?? undefined,
  }, {
    enabled: !!filters.selectedEnvironment,
  })

  // Fetch dag runs with open alerts
  const { data: runAlerts } = trpc.alerts.getDagRunsWithAlerts.useQuery({})

  const _envLabel = filters.selectedEnvironment 
    ? filters.selectedEnvironment.charAt(0).toUpperCase() + filters.selectedEnvironment.slice(1)
    : ""

  return (
    <div className="space-y-6">
      <PageHeader 
        title="DAG Runs"
        description={`View all DAG runs and their details`}
      />

      <RunsFilters
        search={filters.search}
        onSearchChange={(v: string) => setFilter("search", v)}
        timeframe={filters.timeframe}
        onTimeframeChange={(v) => {
          setFilter("timeframe", v)
          // Clear custom date range when timeframe is changed
          setFilter("startTime", null)
          setFilter("endTime", null)
        }}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={(v) => setFilter("statusFilter", v)}
        runTypeFilter={filters.runTypeFilter}
        onRunTypeFilterChange={(v) => setFilter("runTypeFilter", v)}
        selectedEnvironment={filters.selectedEnvironment}
        onEnvironmentChange={(v: string | null) => setFilter("selectedEnvironment", v)}
        customDateRange={filters.startTime && filters.endTime ? { 
          startTime: filters.startTime, 
          endTime: filters.endTime 
        } : null}
        onClearCustomDateRange={() => {
          setFilter("startTime", null)
          setFilter("endTime", null)
        }}
      />

      <RunsTable runs={runs} isLoading={isLoading || envsLoading || !isHydrated} runAlerts={runAlerts} />
    </div>
  )
}

export default function RunsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RunsPageContent />
    </Suspense>
  )
}
