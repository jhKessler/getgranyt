"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useEnvironment } from "@/lib/environment-context"

interface ErrorEnvironmentStatus {
  environment: string
  occurrenceCount: number
  lastSeenAt: Date | string
}

interface ErrorEnvironmentBreadcrumbProps {
  statuses: ErrorEnvironmentStatus[]
  selectedEnv: string | null
  onSelectEnv: (env: string | null) => void
}

export type { ErrorEnvironmentStatus }

export function ErrorEnvironmentBreadcrumb({ 
  statuses, 
  selectedEnv, 
  onSelectEnv,
}: ErrorEnvironmentBreadcrumbProps) {
  const { environments } = useEnvironment()
  
  // Sort statuses to put default environment first
  const sortedStatuses = useMemo(() => {
    if (statuses.length === 0) return []
    
    // Find which environment is the default
    const defaultEnvName = environments.find(e => e.isDefault)?.name
    
    return [...statuses].sort((a, b) => {
      // Default environment comes first
      if (a.environment === defaultEnvName) return -1
      if (b.environment === defaultEnvName) return 1
      // Then sort alphabetically
      return a.environment.localeCompare(b.environment)
    })
  }, [statuses, environments])
  
  if (sortedStatuses.length === 0) return null

  const totalOccurrences = statuses.reduce((sum, s) => sum + s.occurrenceCount, 0)

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
      {/* All environments option */}
      <button
        onClick={() => onSelectEnv(null)}
        className={cn(
          "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
          selectedEnv === null
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        <span>All</span>
        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 min-w-4">
          {totalOccurrences}
        </Badge>
      </button>
      
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
          <Badge 
            variant={selectedEnv === status.environment ? "default" : "secondary"} 
            className="text-xs px-1.5 py-0 h-4 min-w-4"
          >
            {status.occurrenceCount}
          </Badge>
        </button>
      ))}
    </div>
  )
}
