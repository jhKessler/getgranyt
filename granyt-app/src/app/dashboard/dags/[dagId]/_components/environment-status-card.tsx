"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { getRunStatusDotColor } from "@/lib/status-colors"

interface EnvironmentStatus {
  environment: string
  lastStatus: string | null
  lastRunTime: Date | string | null
  openErrorCount: number
  openAlertCount: number
}

interface EnvironmentStatusCardProps {
  statuses: EnvironmentStatus[]
  selectedEnv: string | null
  onSelectEnv: (env: string | null) => void
  isLoading: boolean
}

function EnvironmentButton({ 
  status, 
  isSelected, 
  onSelect 
}: { 
  status: EnvironmentStatus
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      size="sm"
      onClick={onSelect}
      className="gap-2"
    >
      <span className="capitalize">{status.environment}</span>
      {status.lastStatus && (
        <span className={cn(
          "h-2 w-2 rounded-full",
          getRunStatusDotColor(status.lastStatus)
        )} />
      )}
      {status.openErrorCount > 0 && (
        <Badge variant="destructive" className="text-xs px-1 py-0">
          {status.openErrorCount}
        </Badge>
      )}
    </Button>
  )
}

export function EnvironmentStatusCard({ 
  statuses, 
  selectedEnv, 
  onSelectEnv,
  isLoading 
}: EnvironmentStatusCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Environments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (statuses.length <= 1) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Environments
        </CardTitle>
        <CardDescription>This DAG runs in multiple environments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedEnv === null ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectEnv(null)}
          >
            All
          </Button>
          {statuses.map((status) => (
            <EnvironmentButton
              key={status.environment}
              status={status}
              isSelected={selectedEnv === status.environment}
              onSelect={() => onSelectEnv(status.environment)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
