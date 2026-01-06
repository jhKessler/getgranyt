"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge, AlertIndicator, DataCard, TableHeadWithTooltip, EmptyState, AirflowLink } from "@/components/shared"
import { formatDuration } from "@/lib/format"
import { format, formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { GitBranch } from "lucide-react"

export interface DagOverview {
  id: string
  dagId: string
  lastStatus: string | null
  successRate: number
  totalRuns: number
  avgDuration: number | null
  schedule: string | null
  lastRunTime: Date | string | null
  lastRunId: string | null
}

export interface DagAlertInfo {
  count: number
  hasCritical: boolean
  alertId: string
}

interface DagsTableProps {
  dags: DagOverview[] | undefined
  isLoading: boolean
  selectedEnvironment?: string | null
  basePath?: string
  dagAlerts?: Record<string, DagAlertInfo>
  airflowUrl?: string | null
}



function DagRow({ dag, selectedEnvironment, alertInfo, basePath = "/dashboard", airflowUrl }: { 
  dag: DagOverview; 
  selectedEnvironment?: string | null;
  alertInfo?: DagAlertInfo;
  basePath?: string;
  airflowUrl?: string | null;
}) {
  const router = useRouter()

  const handleClick = () => {
    const envParam = selectedEnvironment ? `?env=${encodeURIComponent(selectedEnvironment)}` : ""
    router.push(`${basePath}/dags/${encodeURIComponent(dag.dagId)}${envParam}`)
  }

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleClick}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{dag.dagId}</span>
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
        {dag.lastRunTime ? (
          <span 
            className="hover:underline hover:text-primary transition-colors"
            title={format(new Date(dag.lastRunTime), "MMM d, yyyy HH:mm:ss")}
            onClick={(e) => {
              if (dag.lastRunId) {
                e.stopPropagation()
                const envParam = selectedEnvironment ? `?env=${encodeURIComponent(selectedEnvironment)}` : ""
                router.push(`${basePath}/dags/${encodeURIComponent(dag.dagId)}/runs/${dag.lastRunId}${envParam}`)
              }
            }}
          >
            {formatDistanceToNow(new Date(dag.lastRunTime), { addSuffix: true })}
          </span>
        ) : "-"}
      </TableCell>
      <TableCell>
        <StatusBadge status={dag.lastStatus} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {dag.schedule || "-"}
      </TableCell>
      <TableCell className="text-right">
        {formatDuration(dag.avgDuration)}
      </TableCell>
      <TableCell>
        <AirflowLink 
          airflowUrl={airflowUrl}
          dagId={dag.dagId}
          variant="icon"
          size="sm"
        />
      </TableCell>
    </TableRow>
  )
}



export function DagsTable({ dags, isLoading, selectedEnvironment, basePath = "/dashboard", dagAlerts, airflowUrl }: DagsTableProps) {
  return (
    <DataCard
      title="All DAGs"
      count={dags?.length}
      itemName="DAG"
      isLoading={isLoading}
      emptyState={
        <EmptyState 
          icon={GitBranch}
          title="No DAGs found"
          description="Start running DAGs with the Granyt SDK"
        />
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DAG ID</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHeadWithTooltip tooltip="Status of the most recent DAG run">
              Last Status
            </TableHeadWithTooltip>
            <TableHeadWithTooltip tooltip="The cron schedule or interval configured for this DAG">
              Schedule
            </TableHeadWithTooltip>
            <TableHeadWithTooltip className="text-right" tooltip="Average execution time across all runs in the selected timeframe">
              Avg Duration
            </TableHeadWithTooltip>
            {airflowUrl && <TableHead className="w-10"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dags?.map((dag) => (
            <DagRow 
              key={dag.id} 
              dag={dag} 
              selectedEnvironment={selectedEnvironment}
              alertInfo={dagAlerts?.[dag.dagId]}
              basePath={basePath}
              airflowUrl={airflowUrl}
            />
          ))}
        </TableBody>
      </Table>
    </DataCard>
  )
}