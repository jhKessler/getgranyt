"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertTriangle, CheckCircle, Clock, XCircle, Eye, Globe } from "lucide-react"
import { format } from "date-fns"
import { EnvironmentBadge } from "@/components/shared"
import { ErrorStatus } from "@/server/services/dashboard/types"
import { getErrorStatusBadgeStyle } from "@/lib/status-colors"

interface ErrorHeaderCardProps {
  error: {
    id: string
    exceptionType: string
    message: string
    status: string
    firstSeenAt: Date | string
    lastSeenAt: Date | string
    occurrenceCount: number
    environments?: string[]
  }
  uniqueDagCount: number
  onUpdateStatus: (status: ErrorStatus) => void
  isUpdating: boolean
  showActions?: boolean
}

export function ErrorHeaderCard({ 
  error, 
  uniqueDagCount, 
  onUpdateStatus, 
  isUpdating,
  showActions = true
}: ErrorHeaderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive mt-1" />
            <div>
              <CardTitle className="text-xl">{error.message}</CardTitle>
              <CardDescription className="mt-1">
                {error.exceptionType}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={getErrorStatusBadgeStyle(error.status)}>
            {error.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ErrorMetadata error={error} uniqueDagCount={uniqueDagCount} />
        
        {error.environments && error.environments.length > 0 && (
          <EnvironmentBadges environments={error.environments} />
        )}

        {showActions && (
          <ErrorActions 
            status={error.status} 
            onUpdateStatus={onUpdateStatus} 
            isUpdating={isUpdating} 
          />
        )}
      </CardContent>
    </Card>
  )
}

function ErrorMetadata({ error, uniqueDagCount }: { 
  error: ErrorHeaderCardProps["error"]
  uniqueDagCount: number 
}) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>First seen: {format(new Date(error.firstSeenAt), "MMM d, yyyy HH:mm")}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>Last seen: {format(new Date(error.lastSeenAt), "MMM d, yyyy HH:mm")}</span>
      </div>
      <div>
        <span className="font-medium">{error.occurrenceCount}</span> total occurrence{error.occurrenceCount !== 1 ? "s" : ""}
      </div>
      <div>
        <span className="font-medium">{uniqueDagCount}</span> DAG{uniqueDagCount !== 1 ? "s" : ""} affected
      </div>
    </div>
  )
}

function EnvironmentBadges({ environments }: { environments: string[] }) {
  return (
    <div className="flex items-center gap-2 mt-4">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Environments:</span>
      {environments.map((env: string) => (
        <EnvironmentBadge key={env} environment={env} variant="error" />
      ))}
    </div>
  )
}

function ErrorActions({ status, onUpdateStatus, isUpdating }: {
  status: string
  onUpdateStatus: (status: ErrorStatus) => void
  isUpdating: boolean
}) {
  return (
    <div className="flex gap-2">
      {status !== ErrorStatus.Resolved && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              onClick={() => onUpdateStatus(ErrorStatus.Resolved)}
              disabled={isUpdating}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Mark this error as fixed. It will be reopened if the same error occurs again.</p>
          </TooltipContent>
        </Tooltip>
      )}
      {status !== ErrorStatus.Ignored && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onUpdateStatus(ErrorStatus.Ignored)}
              disabled={isUpdating}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Ignore
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Ignore this error. Future occurrences will still be tracked but won&apos;t show in open errors.</p>
          </TooltipContent>
        </Tooltip>
      )}
      {status !== ErrorStatus.Open && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onUpdateStatus(ErrorStatus.Open)}
              disabled={isUpdating}
            >
              <Eye className="h-4 w-4 mr-2" />
              Reopen
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Reopen this error to mark it as needing attention again.</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export { ErrorActions }
