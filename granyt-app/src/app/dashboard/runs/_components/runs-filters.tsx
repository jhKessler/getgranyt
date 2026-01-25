"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Globe, Clock, Activity, Play, X, CalendarRange } from "lucide-react"
import { useEnvironment } from "@/lib/environment-context"
import { Timeframe, RunStatusFilter, RunType } from "@/server/services/dashboard/types"
import { format } from "date-fns"

interface Environment {
  name: string
  isDefault: boolean
}

interface CustomDateRange {
  startTime: string
  endTime: string
}

interface RunsFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  timeframe: Timeframe
  onTimeframeChange: (timeframe: Timeframe) => void
  statusFilter: RunStatusFilter
  onStatusFilterChange: (status: RunStatusFilter) => void
  runTypeFilter: RunType | "all"
  onRunTypeFilterChange: (runType: RunType | "all") => void
  selectedEnvironment: string | null
  onEnvironmentChange: (env: string | null) => void
  environments?: Environment[]
  isLoading?: boolean
  customDateRange?: CustomDateRange | null
  onClearCustomDateRange?: () => void
}

function formatCustomRange(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  // Check if same day
  const sameDay = start.toDateString() === end.toDateString()
  if (sameDay) {
    return `${format(start, "MMM d, HH:mm")} - ${format(end, "HH:mm")}`
  }
  return `${format(start, "MMM d, HH:mm")} - ${format(end, "MMM d, HH:mm")}`
}

export function RunsFilters({
  search,
  onSearchChange,
  timeframe,
  onTimeframeChange,
  statusFilter,
  onStatusFilterChange,
  runTypeFilter,
  onRunTypeFilterChange,
  selectedEnvironment,
  onEnvironmentChange,
  environments: propEnvironments,
  isLoading: propLoading,
  customDateRange,
  onClearCustomDateRange,
}: RunsFiltersProps) {
  const { environments: contextEnvironments, isLoading: contextLoading } = useEnvironment()
  
  const environments = propEnvironments ?? contextEnvironments
  const isLoading = propLoading ?? contextLoading

  return (
    <div className="flex flex-col gap-3">
      {/* Custom date range badge */}
      {customDateRange && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3">
            <CalendarRange className="h-3.5 w-3.5" />
            <span className="font-medium">{formatCustomRange(customDateRange.startTime, customDateRange.endTime)}</span>
            {onClearCustomDateRange && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-muted"
                onClick={onClearCustomDateRange}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Clear custom date range</span>
              </Button>
            )}
          </Badge>
          <span className="text-sm text-muted-foreground">Custom date range active</span>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:flex-1 sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter by DAG ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Select
          value={selectedEnvironment ?? "all"}
          onValueChange={(v) => onEnvironmentChange(v === "all" ? null : v)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder={isLoading ? "Loading..." : "Environment"} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Environments</SelectItem>
            {environments.map((env) => (
              <SelectItem key={env.name} value={env.name} className="capitalize">
                {env.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeframe} onValueChange={(v) => onTimeframeChange(v as Timeframe)}>
          <SelectTrigger className="w-full sm:w-[140px]">
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
          <SelectTrigger className="w-full sm:w-[140px]">
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
        <Select value={runTypeFilter} onValueChange={(v) => onRunTypeFilterChange(v as RunType | "all")}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All run types</SelectItem>
            <SelectItem value={RunType.Manual}>Manual</SelectItem>
            <SelectItem value={RunType.Scheduled}>Scheduled</SelectItem>
            <SelectItem value={RunType.Backfill}>Backfill</SelectItem>
          </SelectContent>
        </Select>
      </div>
      </div>
    </div>
  )
}
