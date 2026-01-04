"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Globe, Clock, Activity } from "lucide-react"
import { Timeframe, RunStatusFilter } from "@/server/services/dashboard/types"

export interface Environment {
  name: string
  isDefault: boolean
}

interface DagFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  timeframe: Timeframe
  onTimeframeChange: (timeframe: Timeframe) => void
  statusFilter: RunStatusFilter
  onStatusFilterChange: (status: RunStatusFilter) => void
  selectedEnvironment: string | null
  onEnvironmentChange: (env: string | null) => void
  environments: Environment[]
  isEnvsLoading?: boolean
}

export function DagFilters({
  search,
  onSearchChange,
  timeframe,
  onTimeframeChange,
  statusFilter,
  onStatusFilterChange,
  selectedEnvironment,
  onEnvironmentChange,
  environments,
  isEnvsLoading = false,
}: DagFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:flex-1 sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search DAGs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Select 
          value={selectedEnvironment ?? ""} 
          onValueChange={(v) => onEnvironmentChange(v)}
          disabled={isEnvsLoading}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Environment" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {environments.map((env) => (
              <SelectItem key={env.name} value={env.name} className="capitalize">
                {env.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeframe} onValueChange={(v) => onTimeframeChange(v as Timeframe)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Timeframe.Day}>Last 24 hours</SelectItem>
            <SelectItem value={Timeframe.Week}>Last 7 days</SelectItem>
            <SelectItem value={Timeframe.Month}>Last 28 days</SelectItem>
            <SelectItem value={Timeframe.AllTime}>All time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as RunStatusFilter)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RunStatusFilter.All}>All status</SelectItem>
            <SelectItem value={RunStatusFilter.Success}>Success only</SelectItem>
            <SelectItem value={RunStatusFilter.Failed}>Failed only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
