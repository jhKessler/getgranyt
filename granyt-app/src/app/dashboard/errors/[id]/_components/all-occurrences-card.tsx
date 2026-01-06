"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { XCircle, ChevronRight } from "lucide-react"
import { EnvironmentBadge } from "@/components/shared"
import type { Occurrence } from "./affected-dags-card"

interface AllOccurrencesCardProps {
  occurrences: Occurrence[]
  basePath?: string
}

export function AllOccurrencesCard({ occurrences, basePath = "/dashboard" }: AllOccurrencesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Occurrences</CardTitle>
        <CardDescription>
          Complete list of error occurrences across all DAGs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead>DAG</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Run ID</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Try</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {occurrences.map((occurrence: Occurrence) => (
              <OccurrenceRow 
                key={occurrence.id} 
                occurrence={occurrence} 
                basePath={basePath} 
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function OccurrenceRow({ occurrence, basePath }: { occurrence: Occurrence; basePath: string }) {
  const router = useRouter()
  
  // Link to the run page if we have dagId and dagRunId
  const runUrl = occurrence.dagId && occurrence.dagRunId
    ? `${basePath}/dags/${encodeURIComponent(occurrence.dagId)}/runs/${encodeURIComponent(occurrence.dagRunId)}`
    : null
  
  const handleRowClick = () => {
    if (runUrl) {
      router.push(runUrl)
    }
  }
  
  return (
    <TableRow 
      className={runUrl ? "cursor-pointer hover:bg-muted/50 group" : ""}
      onClick={handleRowClick}
    >
      <TableCell>
        <XCircle className="h-4 w-4 text-destructive" />
      </TableCell>
      <TableCell>
        <Link 
          href={`${basePath}/dags/${encodeURIComponent(occurrence.dagId || "unknown")}`}
          className="hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {occurrence.dagId || "unknown"}
        </Link>
      </TableCell>
      <TableCell className="font-mono text-sm">{occurrence.taskId || "-"}</TableCell>
      <TableCell className="font-mono text-sm truncate max-w-[150px]">
        {runUrl ? (
          <Link 
            href={runUrl}
            className="hover:underline text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {occurrence.runId || "-"}
          </Link>
        ) : (
          occurrence.runId || "-"
        )}
      </TableCell>
      <TableCell>
        {occurrence.environment ? (
          <EnvironmentBadge environment={occurrence.environment} variant="muted" />
        ) : "-"}
      </TableCell>
      <TableCell>{occurrence.tryNumber || "-"}</TableCell>
      <TableCell>
        {format(new Date(occurrence.timestamp), "MMM d, HH:mm:ss")}
      </TableCell>
      <TableCell>
        {runUrl ? (
          <Link href={runUrl} className="flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ) : null}
      </TableCell>
    </TableRow>
  )
}
