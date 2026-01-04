"use client"

import { Clock } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Timeframe } from "@/server/services/dashboard/types"
import { cn } from "@/lib/utils"

interface TimeframeSwitcherProps {
  value: Timeframe
  onChange: (value: Timeframe) => void
  className?: string
}

const TIMEFRAME_OPTIONS = [
  { value: Timeframe.Day, label: "Last 24 hours", shortLabel: "24h" },
  { value: Timeframe.Week, label: "Last 7 days", shortLabel: "7d" },
  { value: Timeframe.Month, label: "Last 28 days", shortLabel: "28d" },
  { value: Timeframe.AllTime, label: "All time", shortLabel: "All" },
] as const

export function TimeframeSwitcher({ value, onChange, className }: TimeframeSwitcherProps) {
  const selectedOption = TIMEFRAME_OPTIONS.find((o) => o.value === value)
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-[180px]", className)}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground hidden sm:block" />
          <span className="sm:hidden">{selectedOption?.shortLabel}</span>
          <span className="hidden sm:inline"><SelectValue /></span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {TIMEFRAME_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function getTimeframeLabel(timeframe: Timeframe): string {
  const option = TIMEFRAME_OPTIONS.find((o) => o.value === timeframe)
  return option?.label ?? "Unknown"
}

export function getTimeframeDescription(timeframe: Timeframe): string {
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
