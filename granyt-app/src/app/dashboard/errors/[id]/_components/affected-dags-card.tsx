"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { type StackFrame } from "./stacktrace-view"
import { EnvironmentBadge } from "@/components/shared"
import { formatDistanceToNow } from "date-fns"
import { GitBranch } from "lucide-react"

interface Occurrence {
  id: string
  dagId: string | null
  taskId: string | null
  runId: string | null
  dagRunId: string | null
  tryNumber: number | null
  timestamp: string | Date
  stacktrace?: StackFrame[] | unknown
  environment: string | null
}

interface DagGroup {
  dagId: string
  occurrences: Occurrence[]
  occurrenceCount: number
}

interface AffectedDagsCardProps {
  occurrencesByDag: DagGroup[]
  basePath?: string
}

export function AffectedDagsCard({ occurrencesByDag, basePath = "/dashboard" }: AffectedDagsCardProps) {
  if (occurrencesByDag.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Affected DAGs</CardTitle>
          <CardDescription>
            No DAGs affected in the selected filter
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affected DAGs</CardTitle>
        <CardDescription>
          This error has occurred in {occurrencesByDag.length} DAG{occurrencesByDag.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {occurrencesByDag.map((dagGroup) => (
            <DagListItem key={dagGroup.dagId} dagGroup={dagGroup} basePath={basePath} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DagListItem({ dagGroup, basePath }: { dagGroup: DagGroup; basePath: string }) {
  // Get unique environments for this DAG
  const environments = [...new Set(
    dagGroup.occurrences
      .map(occ => occ.environment)
      .filter((env): env is string => env !== null)
  )]

  // Get the most recent occurrence timestamp
  const lastOccurrence = dagGroup.occurrences.reduce((latest, occ) => {
    const occTime = new Date(occ.timestamp).getTime()
    const latestTime = new Date(latest.timestamp).getTime()
    return occTime > latestTime ? occ : latest
  }, dagGroup.occurrences[0])

  return (
    <Link 
      href={`${basePath}/dags/${encodeURIComponent(dagGroup.dagId)}`}
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">{dagGroup.dagId}</p>
          <div className="flex items-center gap-2 mt-1">
            {environments.slice(0, 3).map(env => (
              <EnvironmentBadge 
                key={env} 
                environment={env} 
                variant="muted" 
                className="text-[10px] px-1 py-0 h-4"
              />
            ))}
            {environments.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                +{environments.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <Badge variant="secondary" className="text-xs">
          {dagGroup.occurrenceCount} occurrence{dagGroup.occurrenceCount !== 1 ? "s" : ""}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">
          Last {formatDistanceToNow(new Date(lastOccurrence.timestamp), { addSuffix: true })}
        </p>
      </div>
    </Link>
  )
}

export type { DagGroup, Occurrence }
