"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/format"

interface TaskRunInfo {
  id: string
  srcTaskId: string
  status: string
  startTime: string | null
  endTime: string | null
  duration: number | null
  operator: string | null
  errorMessage: string | null
  errorId: string | null
}

interface TaskGraphProps {
  tasks: TaskRunInfo[]
  runStartTime: string
}

// Status color helper is now imported from @/lib/status-colors

export function TaskGraph({ tasks, runStartTime }: TaskGraphProps) {
  const { sortedTasks, maxDuration, runStart } = useMemo(() => {
    const runStart = new Date(runStartTime).getTime()
    
    // Sort tasks by start time
    const sorted = [...tasks].sort((a, b) => {
      const aStart = a.startTime ? new Date(a.startTime).getTime() : runStart
      const bStart = b.startTime ? new Date(b.startTime).getTime() : runStart
      return aStart - bStart
    })

    // Find the maximum end time relative to run start
    let maxEnd = 0
    for (const task of sorted) {
      const taskStart = task.startTime ? new Date(task.startTime).getTime() : runStart
      const taskEnd = task.endTime ? new Date(task.endTime).getTime() : (taskStart + (task.duration || 0) * 1000)
      const endOffset = taskEnd - runStart
      if (endOffset > maxEnd) maxEnd = endOffset
    }

    return { 
      sortedTasks: sorted, 
      maxDuration: Math.max(maxEnd, 1000), // At least 1s
      runStart 
    }
  }, [tasks, runStartTime])

  const longestTask = useMemo(() => {
    return [...tasks].sort((a, b) => (b.duration || 0) - (a.duration || 0))[0]
  }, [tasks])

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Execution</CardTitle>
          <CardDescription>Tasks executed during this run</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[100px] items-center justify-center text-muted-foreground">
            No tasks recorded for this run
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Task Timeline</CardTitle>
          <CardDescription>
            {tasks.length} task{tasks.length !== 1 && "s"} • Visualizing task execution order and duration
          </CardDescription>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" /> Success
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" /> Failed
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" /> Running
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mt-4 space-y-2">
          {/* Time markers */}
          <div className="absolute inset-0 flex justify-between pointer-events-none border-x border-dashed border-muted-foreground/20">
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <div key={p} className="h-full border-r border-dashed border-muted-foreground/10" />
            ))}
          </div>

          <div className="relative space-y-3 pt-2">
            {sortedTasks.map((task) => {
              const taskStart = task.startTime ? new Date(task.startTime).getTime() : runStart
              const startOffset = ((taskStart - runStart) / maxDuration) * 100
              const durationPercent = ((task.duration || 0) * 1000 / maxDuration) * 100
              const isLongest = task.id === longestTask?.id && (task.duration || 0) > 0

              const statusColors = {
                success: "bg-green-500/20 border-green-500/50 hover:bg-green-500/30",
                failed: "bg-red-500/20 border-red-500/50 hover:bg-red-500/30",
                running: "bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 animate-pulse",
                default: "bg-muted border-border"
              }

              const color = statusColors[task.status.toLowerCase() as keyof typeof statusColors] || statusColors.default

              return (
                <div key={task.id} className="group relative flex items-center gap-4">
                  <div className="w-32 shrink-0 text-xs font-mono truncate text-muted-foreground group-hover:text-foreground transition-colors">
                    {task.srcTaskId}
                  </div>
                  <div className="relative flex-1 h-8 bg-muted/30 rounded-sm overflow-hidden">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "absolute h-full border rounded-sm transition-all cursor-help flex items-center px-2 overflow-hidden",
                            color,
                            isLongest && "ring-2 ring-yellow-400 ring-offset-1"
                          )}
                          style={{ 
                            left: `${Math.max(0, startOffset)}%`, 
                            width: `${Math.max(2, durationPercent)}%` 
                          }}
                        >
                          <span className="text-[10px] font-bold truncate">
                            {task.duration ? formatDuration(task.duration) : ""}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="p-3 space-y-1">
                        <p className="font-bold">{task.srcTaskId}</p>
                        <p className="text-xs opacity-80">Operator: {task.operator || "unknown"}</p>
                        <p className="text-xs opacity-80">Duration: {formatDuration(task.duration)}</p>
                        <p className="text-xs opacity-80">Status: {task.status}</p>
                        {isLongest && <p className="text-xs text-yellow-500 font-bold">⚠️ Longest running task</p>}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
