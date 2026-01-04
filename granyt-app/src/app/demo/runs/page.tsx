"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared"
import { Timeframe, RunStatusFilter, RunType } from "@/server/services/dashboard/types"
import { mockDagRuns, mockEnvironments } from "../_data/mock-data"
import { RunsTable, RunsFilters } from "@/app/dashboard/runs/_components"
import { isAfter, subDays, subHours } from "date-fns"

export default function DemoRunsPage() {
  const [search, setSearch] = useState("")
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.Week)
  const [statusFilter, setStatusFilter] = useState<RunStatusFilter>(RunStatusFilter.All)
  const [runTypeFilter, setRunTypeFilter] = useState<RunType | "all">("all")
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>("production")

  // Filter runs based on filters
  const filteredRuns = mockDagRuns.filter((run) => {
    const matchesSearch = !search || run.srcDagId.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === RunStatusFilter.All || 
      (statusFilter === RunStatusFilter.Success && run.status === "success") ||
      (statusFilter === RunStatusFilter.Failed && run.status === "failed")
    const matchesRunType = runTypeFilter === "all" || run.runType === runTypeFilter
    const matchesEnv = !selectedEnvironment || run.environment === selectedEnvironment
    
    // Timeframe filter
    let matchesTimeframe = true
    const runDate = new Date(run.startTime)
    const now = new Date()
    
    if (timeframe === Timeframe.Day) {
      matchesTimeframe = isAfter(runDate, subHours(now, 24))
    } else if (timeframe === Timeframe.Week) {
      matchesTimeframe = isAfter(runDate, subDays(now, 7))
    } else if (timeframe === Timeframe.Month) {
      matchesTimeframe = isAfter(runDate, subDays(now, 28))
    }
    
    return matchesSearch && matchesStatus && matchesRunType && matchesEnv && matchesTimeframe
  })

  return (
    <div className="space-y-6">
      <PageHeader 
        title="DAG Runs"
        description="View all DAG runs and their details"
      />

      <RunsFilters
        search={search}
        onSearchChange={setSearch}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        runTypeFilter={runTypeFilter}
        onRunTypeFilterChange={setRunTypeFilter}
        selectedEnvironment={selectedEnvironment}
        onEnvironmentChange={setSelectedEnvironment}
        environments={mockEnvironments}
        isLoading={false}
      />

      <RunsTable 
        runs={filteredRuns} 
        isLoading={false}
        basePath="/demo"
      />
    </div>
  )
}
