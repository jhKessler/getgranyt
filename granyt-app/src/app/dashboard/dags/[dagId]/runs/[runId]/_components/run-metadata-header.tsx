"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { EnvironmentBadge, AirflowLink } from "@/components/shared"
import { useEnvironment } from "@/lib/environment-context"
import { formatDistanceToNow } from "date-fns"

interface RunMetadataHeaderProps {
  run: {
    id: string
    srcDagId: string
    srcRunId: string
    environment: string | null
    status: string | null
    startTime: string
    endTime: string | null
    duration: number | null
    runType: string | null
    tasks: {
      status: string
      errorMessage: string | null
    }[]
  }
  dagId: string
}

export function RunMetadataHeader({ run, dagId }: RunMetadataHeaderProps) {
  const router = useRouter()
  const { getAirflowUrl } = useEnvironment()

  // Get Airflow URL for the run's environment
  const airflowUrl = getAirflowUrl(run.environment)

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(`/dashboard/dags/${encodeURIComponent(dagId)}`)
    }
  }

  const status = run.status?.toLowerCase() || "unknown"
  const failedTask = run.tasks.find(t => t.status.toLowerCase() === "failed")
  const errorMessage = failedTask?.errorMessage

  const bannerStyles = {
    success: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400",
    failed: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",
    running: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
    unknown: "bg-muted border-border text-muted-foreground"
  }

  const statusIcon = {
    success: <CheckCircle2 className="h-8 w-8 text-green-500" />,
    failed: <XCircle className="h-8 w-8 text-red-500" />,
    running: <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />,
    unknown: <AlertTriangle className="h-8 w-8 text-muted-foreground" />
  }

  const currentStyle = bannerStyles[status as keyof typeof bannerStyles] || bannerStyles.unknown
  const currentIcon = statusIcon[status as keyof typeof statusIcon] || statusIcon.unknown

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <AirflowLink
          airflowUrl={airflowUrl}
          dagId={run.srcDagId}
          runId={run.srcRunId}
          variant="button"
          size="sm"
        />
      </div>

      <Card className={cn("border-2 overflow-hidden", currentStyle)}>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-stretch">
            <div className="flex items-center justify-center p-6 bg-background/50 border-r border-inherit">
              {currentIcon}
            </div>
            <div className="flex-1 p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    
                      <h1 className="text-2xl font-bold font-mono tracking-tight">{run.srcRunId}</h1>
                    <Badge variant="outline" className="capitalize border-inherit">
                      {status}
                    </Badge>
                  </div>
                  <Link
                      href={`/dashboard/dags/${encodeURIComponent(dagId)}`}
                      className="hover:underline"
                    >
                  <p className="text-sm mt-1 opacity-80 truncate max-w-[500px]">
                    DAG: {run.srcDagId}
                  </p></Link>
                  <p className="text-sm mt-1 opacity-80 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(run.startTime), { addSuffix: true })}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="capitalize">
                    {run.runType || "manual"}
                  </Badge>
                  <EnvironmentBadge environment={run.environment} />
                </div>
              </div>

              {status === "failed" && errorMessage && (
                <div className="p-3 rounded-md bg-red-500/20 border border-red-500/30 text-sm font-mono">
                  <p className="font-bold mb-1 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Run Failed
                  </p>
                  <p className="break-all">{errorMessage}</p>
                </div>
              )}

              {status === "running" && (
                <div className="flex items-center gap-2 text-sm font-medium animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Run in progress...
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
