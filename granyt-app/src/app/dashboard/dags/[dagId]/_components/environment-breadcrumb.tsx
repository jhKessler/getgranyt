"use client"

import { useMemo, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useEnvironment } from "@/lib/environment-context"
import { getRunStatusDotColor } from "@/lib/status-colors"

interface EnvironmentStatus {
  environment: string
  lastStatus: string | null
  openErrorCount: number
  openAlertCount: number
}

interface Environment {
  name: string
  isDefault: boolean
}

interface EnvironmentBreadcrumbProps {
  statuses: EnvironmentStatus[]
  selectedEnv: string | null
  onSelectEnv: (env: string) => void
  environments?: Environment[]
}

export function EnvironmentBreadcrumb({ 
  statuses, 
  selectedEnv, 
  onSelectEnv,
  environments: propEnvironments
}: EnvironmentBreadcrumbProps) {
  const { environments: contextEnvironments } = useEnvironment()
  const environments = propEnvironments ?? contextEnvironments
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Handle environment selection and update URL
  const handleSelectEnv = useCallback((env: string) => {
    onSelectEnv(env)
    
    // Update URL with new environment
    const params = new URLSearchParams(searchParams.toString())
    params.set("env", env)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [onSelectEnv, router, pathname, searchParams])
  
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

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
      {sortedStatuses.map((status, _index) => (
        <button
          key={status.environment}
          onClick={() => handleSelectEnv(status.environment)}
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
