"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared"
import { Timeframe, RunStatusFilter } from "@/server/services/dashboard/types"
import { mockDags, mockEnvironments, mockDagAlerts } from "../_data/mock-data"
import { DagFilters, DagsTable } from "@/app/dashboard/dags/_components"
import { isAfter, subDays, subHours } from "date-fns"

export default function DemoDagsPage() {
  const [search, setSearch] = useState("")
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.Week)
  const [statusFilter, setStatusFilter] = useState<RunStatusFilter>(RunStatusFilter.All)
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>("production")

  // Filter DAGs based on search and status
  const filteredDags = mockDags.filter((dag) => {
    const matchesSearch = !search || dag.dagId.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === RunStatusFilter.All || 
      (statusFilter === RunStatusFilter.Success && dag.lastStatus === "success") ||
      (statusFilter === RunStatusFilter.Failed && dag.lastStatus === "failed")
    
    // Timeframe filter
    let matchesTimeframe = true
    const lastRunDate = new Date(dag.lastRunTime)
    const now = new Date()
    
    if (timeframe === Timeframe.Day) {
      matchesTimeframe = isAfter(lastRunDate, subHours(now, 24))
    } else if (timeframe === Timeframe.Week) {
      matchesTimeframe = isAfter(lastRunDate, subDays(now, 7))
    } else if (timeframe === Timeframe.Month) {
      matchesTimeframe = isAfter(lastRunDate, subDays(now, 28))
    }

    return matchesSearch && matchesStatus && matchesTimeframe
  })

  return (
    <div className="space-y-6">
      <PageHeader 
        title="DAGs"
        description="Overview of all your DAGs and their recent performance"
      />

      <DagFilters
        search={search}
        onSearchChange={setSearch}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedEnvironment={selectedEnvironment}
        onEnvironmentChange={setSelectedEnvironment}
        environments={mockEnvironments}
      />

      <DagsTable 
        dags={filteredDags} 
        isLoading={false}
        selectedEnvironment={selectedEnvironment}
        basePath="/demo"
        dagAlerts={mockDagAlerts}
      />
    </div>
  )
}
