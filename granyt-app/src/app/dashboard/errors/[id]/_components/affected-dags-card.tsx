"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import { StacktraceView, type StackFrame } from "./stacktrace-view"
import { EnvironmentBadge } from "@/components/shared"

interface Occurrence {
  id: string
  dagId: string | null
  taskId: string | null
  runId: string | null
  dagRunId: string | null
  tryNumber: number | null
  timestamp: string | Date
  stacktrace: StackFrame[] | null
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Affected DAGs</CardTitle>
        <CardDescription>
          This error has occurred in the following DAGs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {occurrencesByDag.map((dagGroup) => (
            <DagOccurrenceGroup key={dagGroup.dagId} dagGroup={dagGroup} basePath={basePath} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DagOccurrenceGroup({ dagGroup, basePath }: { dagGroup: DagGroup; basePath: string }) {
  // Get unique environments for this DAG
  const environments = [...new Set(
    dagGroup.occurrences
      .map(occ => occ.environment)
      .filter((env): env is string => env !== null)
  )]

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link 
            href={`${basePath}/dags/${encodeURIComponent(dagGroup.dagId)}`}
            className="font-semibold hover:underline"
          >
            {dagGroup.dagId}
          </Link>
          <div className="flex items-center gap-1">
            {environments.map(env => (
              <EnvironmentBadge key={env} environment={env} variant="error" />
            ))}
          </div>
        </div>
        <Badge variant="secondary">
          {dagGroup.occurrenceCount} occurrence{dagGroup.occurrenceCount !== 1 ? "s" : ""}
        </Badge>
      </div>
      
      {dagGroup.occurrences.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">Recent occurrences</p>
          <OccurrencesTable occurrences={dagGroup.occurrences.slice(0, 5)} basePath={basePath} />
          
          {dagGroup.occurrences[0]?.stacktrace && (
            <details className="mt-4">
              <summary className="text-sm font-medium cursor-pointer hover:text-primary">
                View Stacktrace
              </summary>
              <div className="mt-2 border rounded-lg">
                <StacktraceView stacktrace={dagGroup.occurrences[0].stacktrace} />
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function OccurrencesTable({ occurrences, basePath }: { occurrences: Occurrence[]; basePath: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Run ID</TableHead>
          <TableHead>Environment</TableHead>
          <TableHead>Try</TableHead>
          <TableHead>Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {occurrences.map((occ: Occurrence) => (
          <TableRow key={occ.id}>
            <TableCell className="font-mono text-sm">{occ.taskId || "-"}</TableCell>
            <TableCell className="font-mono text-sm truncate max-w-[200px]">
              {occ.dagRunId && occ.dagId ? (
                <Link 
                  href={`${basePath}/dags/${encodeURIComponent(occ.dagId)}/runs/${encodeURIComponent(occ.dagRunId)}`}
                  className="hover:underline text-primary"
                >
                  {occ.runId || "-"}
                </Link>
              ) : (
                occ.runId || "-"
              )}
            </TableCell>
            <TableCell>
              {occ.environment ? (
                <EnvironmentBadge environment={occ.environment} variant="muted" />
              ) : "-"}
            </TableCell>
            <TableCell>{occ.tryNumber || "-"}</TableCell>
            <TableCell>
              {format(new Date(occ.timestamp), "MMM d, HH:mm:ss")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export type { DagGroup, Occurrence }
