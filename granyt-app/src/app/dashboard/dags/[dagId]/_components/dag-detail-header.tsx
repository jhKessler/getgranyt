"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { Timeframe } from "@/server/services/dashboard/types"
import { MetricsSettingsDialog } from "./metrics-settings-dialog"
import { AirflowLink } from "@/components/shared"

interface DagDetailHeaderProps {
  dagId: string
  localEnv: string | null
  timeframe: Timeframe
  onTimeframeChange: (timeframe: Timeframe) => void
  onMetricsSettingsChange?: () => void
  basePath?: string
  showSettings?: boolean
  airflowUrl?: string | null
}

export function DagDetailHeader({
  dagId,
  localEnv,
  timeframe,
  onTimeframeChange,
  onMetricsSettingsChange,
  basePath = "/dashboard",
  showSettings = true,
  airflowUrl,
}: DagDetailHeaderProps) {

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href={`${basePath}/dags`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dagId}</h1>
          <p className="text-muted-foreground">
            DAG details and run history
            {localEnv && <span className="capitalize"> ({localEnv})</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AirflowLink
          airflowUrl={airflowUrl}
          dagId={dagId}
          variant="button"
          size="sm"
        />
        {showSettings && <MetricsSettingsDialog dagId={dagId} onSettingsChange={onMetricsSettingsChange} />}
        <Select value={timeframe} onValueChange={(v) => onTimeframeChange(v as Timeframe)}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Timeframe.Day}>Last 24 hours</SelectItem>
            <SelectItem value={Timeframe.Week}>Last 7 days</SelectItem>
            <SelectItem value={Timeframe.Month}>Last 28 days</SelectItem>
            <SelectItem value={Timeframe.AllTime}>All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
