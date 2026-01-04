"use client"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CheckCircle, XCircle, Clock, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { RunStatus, RUN_STATUS_BADGE_STYLES } from "@/lib/status-colors"

interface StatusBadgeProps {
  status: RunStatus | string | null
  className?: string
  showTooltip?: boolean
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
  running: <Clock className="h-3 w-3 animate-spin" />,
}

const STATUS_TOOLTIPS: Record<string, string> = {
  success: "DAG run completed successfully without errors",
  failed: "DAG run encountered an error or exception",
  running: "DAG run is currently in progress",
}

export function StatusBadge({ status, className, showTooltip = true }: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <Minus className="h-3 w-3" />
        No runs
      </Badge>
    )
  }

  const normalizedStatus = status.toLowerCase()
  const badge = (
    <Badge variant="outline" className={cn("gap-1", RUN_STATUS_BADGE_STYLES[normalizedStatus as RunStatus] || "", className)}>
      {STATUS_ICONS[normalizedStatus]}
      {status}
    </Badge>
  )

  if (!showTooltip || !STATUS_TOOLTIPS[normalizedStatus]) {
    return badge
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{STATUS_TOOLTIPS[normalizedStatus]}</p>
      </TooltipContent>
    </Tooltip>
  )
}
