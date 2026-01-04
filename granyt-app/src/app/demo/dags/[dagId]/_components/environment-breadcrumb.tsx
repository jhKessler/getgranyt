"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getRunStatusDotColor } from "@/lib/status-colors"

interface EnvironmentStatus {
  environment: string
  lastStatus: string | null
  openErrorCount: number
  openAlertCount: number
}

interface EnvironmentBreadcrumbProps {
  statuses: EnvironmentStatus[]
  selectedEnv: string | null
  onSelectEnv: (env: string) => void
}

export function EnvironmentBreadcrumb({ 
  statuses, 
  selectedEnv, 
  onSelectEnv 
}: EnvironmentBreadcrumbProps) {
  
  // Sort statuses to put production first
  const sortedStatuses = useMemo(() => {
    if (statuses.length === 0) return []
    
    return [...statuses].sort((a, b) => {
      if (a.environment === "production") return -1
      if (b.environment === "production") return 1
      return a.environment.localeCompare(b.environment)
    })
  }, [statuses])
  
  if (sortedStatuses.length === 0) return null

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
      {sortedStatuses.map((status) => (
        <button
          key={status.environment}
          onClick={() => onSelectEnv(status.environment)}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
            selectedEnv === status.environment
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <span className="capitalize">{status.environment}</span>
          {status.lastStatus && (
            <span className={cn(
              "h-2 w-2 rounded-full",
              getRunStatusDotColor(status.lastStatus)
            )} />
          )}
          {status.openAlertCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          )}
          {status.openErrorCount > 0 && (
            <Badge variant="destructive" className="text-xs px-1 py-0 h-4 min-w-4">
              {status.openErrorCount}
            </Badge>
          )}
        </button>
      ))}
    </div>
  )
}
