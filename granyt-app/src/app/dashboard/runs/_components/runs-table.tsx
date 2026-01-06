"use client"

import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge, EnvironmentBadge, AlertIndicator, DataCard, TableHeadWithTooltip, EmptyState, AirflowLink } from "@/components/shared"
import { formatDuration } from "@/lib/format"
import { format, formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { Play } from "lucide-react"

import { Badge } from "@/components/ui/badge"

export interface DagRunItem {
  id: string
  srcDagId: string
  srcRunId: string
  status: string | null
  startTime: Date | string
  endTime: Date | string | null
  duration: number | null
  runType: string | null
  environment: string | null
  taskCount: number
  errorCount: number
  schedule: string | null
}

export interface RunAlertInfo {
  count: number
  hasCritical: boolean
  alertId: string
}

interface RunsTableProps {
  runs: DagRunItem[] | undefined
  isLoading: boolean
  basePath?: string
  runAlerts?: Record<string, RunAlertInfo>
  airflowUrl?: string | null
}



function RunTypeCell({ runType }: { runType: string | null }) {
  if (!runType) return <span className="text-muted-foreground">-</span>

  const colorMap: Record<string, string> = {
    manual: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    backfill: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  }

  return (
    <Badge variant="outline" className={colorMap[runType] || ""}>
      {runType}
    </Badge>
  )
}

function RunRow({ run, alertInfo, basePath = "/dashboard", airflowUrl }: { 
  run: DagRunItem;
  alertInfo?: RunAlertInfo;
  basePath?: string;
  airflowUrl?: string | null;
}) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`${basePath}/dags/${encodeURIComponent(run.srcDagId)}/runs/${encodeURIComponent(run.id)}`)
  }

  const handleDagClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`${basePath}/dags/${encodeURIComponent(run.srcDagId)}`)
  }

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleClick}
    >
      <TableCell>
        <StatusBadge status={run.status} />
      </TableCell>
      <TableCell className="font-mono font-medium">
        <div className="flex items-center gap-2">
          <span>{run.srcRunId}</span>
          {alertInfo && (
            <AlertIndicator 
              alertId={alertInfo.alertId}
              count={alertInfo.count}
              hasCritical={alertInfo.hasCritical}
            />
          )}
        </div>
      </TableCell>
      <TableCell>
        <span 
          className="text-xs text-muted-foreground hover:underline hover:text-primary transition-colors cursor-pointer"
          onClick={handleDagClick}
        >
          {run.srcDagId}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">
        <span title={format(new Date(run.startTime), "MMM d, yyyy HH:mm:ss")}>
          {formatDistanceToNow(new Date(run.startTime), { addSuffix: true })}
        </span>
      </TableCell>
      <TableCell>
        {run.environment && <EnvironmentBadge environment={run.environment} variant="muted" />}
      </TableCell>
      <TableCell>
        <RunTypeCell runType={run.runType} />
      </TableCell>
      <TableCell className="text-right">
        {formatDuration(run.duration)}
      </TableCell>
      <TableCell>
        <AirflowLink 
          airflowUrl={airflowUrl}
          dagId={run.srcDagId}
          runId={run.srcRunId}
          variant="icon"
          size="sm"
        />
      </TableCell>
    </TableRow>
  )
}



export function RunsTable({ runs, isLoading, basePath = "/dashboard", runAlerts, airflowUrl }: RunsTableProps) {
  return (
    <DataCard
      title="All Runs"
      count={runs?.length}
      itemName="run"
      isLoading={isLoading}
      emptyState={
        <EmptyState 
          icon={Play}
          title="No runs found"
          description="No DAG runs have been recorded yet"
        />
      }
      skeletonRows={10}
      skeletonHeight="h-14"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeadWithTooltip tooltip="The status of this DAG run">
              Status
            </TableHeadWithTooltip>
            <TableHead>Run ID</TableHead>
            <TableHead>DAG ID</TableHead>
            <TableHead>Started</TableHead>
            <TableHeadWithTooltip tooltip="The environment where this run was executed">
              Environment
            </TableHeadWithTooltip>
            <TableHeadWithTooltip tooltip="How the run was triggered: manual, scheduled, or backfill">
              Run Type
            </TableHeadWithTooltip>
            <TableHeadWithTooltip className="text-right" tooltip="Total execution time of this run">
              Duration
            </TableHeadWithTooltip>
            {airflowUrl && <TableHead className="w-10"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs?.map((run) => (
            <RunRow 
              key={run.id} 
              run={run}
              alertInfo={runAlerts?.[run.id]}
              basePath={basePath}
              airflowUrl={airflowUrl}
            />
          ))}
        </TableBody>
      </Table>
    </DataCard>
  )
}