"use client"

import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge, EnvironmentBadge, AlertIndicator, DataCard, TableHeadWithTooltip, EmptyState } from "@/components/shared"
import { formatDuration } from "@/lib/format"
import { format, formatDistanceToNow } from "date-fns"
import { ChevronRight, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface RunData {
  id: string
  runId: string
  status: string | null
  startTime: string | Date
  duration: number | null
  runType: string | null
  environment?: string | null
}

export interface RunAlertInfo {
  count: number
  hasCritical: boolean
  alertId: string
}

interface RunsTableProps {
  dagId: string
  runs: RunData[] | undefined
  isLoading: boolean
  showEnvironment?: boolean
  basePath?: string
  runAlerts?: Record<string, RunAlertInfo>
}





function RunRow({ run, showEnvironment, dagId: _dagId, onClick, alertInfo }: { 
  run: RunData; 
  showEnvironment?: boolean; 
  dagId: string; 
  onClick: () => void;
  alertInfo?: RunAlertInfo;
}) {
  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <TableCell className="font-mono text-sm truncate max-w-[200px]">
        <div className="flex items-center gap-2">
          <span>{run.runId}</span>
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
        <StatusBadge status={run.status} />
      </TableCell>
      {showEnvironment && (
        <TableCell>
          <EnvironmentBadge environment={run.environment} variant="muted" />
        </TableCell>
      )}
      <TableCell className="text-muted-foreground">
        <span title={format(new Date(run.startTime), "MMM d, yyyy HH:mm:ss")}>
          {formatDistanceToNow(new Date(run.startTime), { addSuffix: true })}
        </span>
      </TableCell>
      <TableCell className="text-right">
        {formatDuration(run.duration)}
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{run.runType || "manual"}</Badge>
      </TableCell>
      <TableCell>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </TableCell>
    </TableRow>
  )
}



export function RunsTable({ dagId, runs, isLoading, showEnvironment = false, basePath = "/dashboard", runAlerts }: RunsTableProps) {
  const router = useRouter()

  const handleRowClick = (runId: string) => {
    router.push(`${basePath}/dags/${encodeURIComponent(dagId)}/runs/${encodeURIComponent(runId)}`)
  }

  return (
    <DataCard
      title="Recent Runs"
      description={`${runs?.length || 0} run${runs?.length !== 1 ? "s" : ""} in the selected timeframe. Click a run for details.`}
      isLoading={isLoading}
      count={runs?.length}
      itemName="run"
      emptyState={<EmptyState title="No runs in this timeframe" description="Try selecting a longer timeframe" icon={Calendar} />}
      skeletonRows={5}
      skeletonHeight="h-12"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeadWithTooltip tooltip="Unique identifier for this DAG execution from your orchestrator">
              Run ID
            </TableHeadWithTooltip>
            <TableHead>Status</TableHead>
            {showEnvironment && <TableHead>Environment</TableHead>}
            <TableHead>Start Time</TableHead>
            <TableHeadWithTooltip className="text-right" tooltip="Total execution time from start to finish">
              Duration
            </TableHeadWithTooltip>
            <TableHeadWithTooltip tooltip="How the run was triggered: manual, scheduled, or external">
              Type
            </TableHeadWithTooltip>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs?.map((run) => (
            <RunRow 
              key={run.id} 
              run={run} 
              showEnvironment={showEnvironment} 
              dagId={dagId}
              onClick={() => handleRowClick(run.id)}
              alertInfo={runAlerts?.[run.id]}
            />
          ))}
        </TableBody>
      </Table>
    </DataCard>
  )
}