"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/shared"
import { ArrowLeft, Play, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { formatDuration } from "@/lib/format"
import { mockRunDetails, mockDagRuns } from "../../../../_data/mock-data"
import { cn } from "@/lib/utils"

export default function DemoRunDetailPage({ 
  params 
}: { 
  params: Promise<{ dagId: string; runId: string }> 
}) {
  const resolvedParams = use(params)
  const dagId = decodeURIComponent(resolvedParams.dagId)
  const runId = decodeURIComponent(resolvedParams.runId)
  
  // Try to find detailed run data, or fall back to basic run info
  const runDetails = mockRunDetails[runId]
  const basicRun = mockDagRuns.find(r => r.id === runId)
  
  if (!runDetails && !basicRun) {
    return <RunNotFound dagId={dagId} />
  }

  const run = runDetails || {
    id: runId,
    srcDagId: dagId,
    srcRunId: basicRun?.srcRunId || runId,
    status: basicRun?.status || "unknown",
    startTime: basicRun?.startTime || new Date().toISOString(),
    endTime: basicRun?.endTime || null,
    duration: basicRun?.duration || null,
    runType: basicRun?.runType || "manual",
    environment: basicRun?.environment || "production",
    rowsProcessed: basicRun?.rowsProcessed || 0,
    tasks: [],
    captures: [],
  }

  const taskCount = runDetails?.tasks.length || basicRun?.taskCount || 0
  const errorCount = runDetails?.tasks.filter(t => t.status === "failed").length || basicRun?.errorCount || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href={`/demo/dags/${encodeURIComponent(dagId)}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {dagId}
            </Button>
          </Link>
        </div>
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{dagId}</h1>
            <StatusBadge status={run.status} />
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-sm">{run.srcRunId}</p>
        </div>
      </div>

      {/* Run Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <Badge variant={run.environment === "production" ? "default" : "secondary"} className="mt-1">
                {run.environment}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Run Type</p>
              <p className="font-medium capitalize mt-1">{run.runType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Started</p>
              <p className="font-medium mt-1">
                {format(new Date(run.startTime), "MMM d, yyyy HH:mm:ss")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium mt-1">
                {run.duration ? formatDuration(run.duration) : "Running..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Errors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errorCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rows Processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{run.rowsProcessed.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Graph */}
      {runDetails && runDetails.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task Execution</CardTitle>
            <CardDescription>Visual timeline of task execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {runDetails.tasks.map((task) => (
                <TaskRow key={task.taskId} task={task} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Flow */}
      {runDetails && runDetails.captures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Flow</CardTitle>
            <CardDescription>Row counts at each capture point</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              {runDetails.captures.map((capture, index) => (
                <div key={capture.id} className="flex-1">
                  <div className="flex items-center gap-2">
                    {index > 0 && (
                      <div className="flex-1 h-0.5 bg-border" />
                    )}
                    <div className={cn(
                      "p-4 rounded-lg border text-center min-w-[140px]",
                      capture.position === "source" && "border-blue-500/30 bg-blue-500/5",
                      capture.position === "intermediate" && "border-yellow-500/30 bg-yellow-500/5",
                      capture.position === "destination" && "border-green-500/30 bg-green-500/5"
                    )}>
                      <p className="font-mono text-xs text-muted-foreground mb-1">
                        {capture.capturePointId}
                      </p>
                      <p className="text-lg font-bold">{capture.rowCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">rows</p>
                    </div>
                    {index < runDetails.captures.length - 1 && (
                      <div className="flex-1 h-0.5 bg-border" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TaskRow({ task }: { task: { taskId: string; status: string; duration: number | null; errorId: string | null } }) {
  const StatusIcon = task.status === "success" ? CheckCircle2 
    : task.status === "failed" ? XCircle 
    : task.status === "running" ? Play 
    : AlertTriangle

  const statusColor = task.status === "success" ? "text-green-500"
    : task.status === "failed" ? "text-red-500"
    : task.status === "running" ? "text-blue-500"
    : "text-muted-foreground"

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border">
      <StatusIcon className={cn("h-5 w-5", statusColor)} />
      <div className="flex-1">
        <p className="font-mono text-sm">{task.taskId}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {task.duration ? formatDuration(task.duration) : "-"}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{task.status}</p>
      </div>
      {task.errorId && (
        <Link href={`/demo/errors/${task.errorId}`}>
          <Button variant="destructive" size="sm">
            View Error
          </Button>
        </Link>
      )}
    </div>
  )
}

function RunNotFound({ dagId }: { dagId: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/demo/dags/${encodeURIComponent(dagId)}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {dagId}
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Run not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This is a demo with limited data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
