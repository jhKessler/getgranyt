"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"
import { DataFlowFunnelProps } from "./types"
import { getRowCount, groupCapturesByTask } from "./utils"
import { TaskCard } from "./task-card"
import { FlowConnector } from "./flow-connector"

export function DataFlowFunnel({ captures, tasks }: DataFlowFunnelProps) {
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set())

  const taskGroups = useMemo(() => groupCapturesByTask(captures, tasks), [captures, tasks])

  const totalRowsSum = useMemo(() =>
    captures.reduce((acc, c) => acc + getRowCount(c.metrics), 0),
    [captures])

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedTaskIds(new Set(taskGroups.map(g => g.taskId)))
  }

  const collapseAll = () => {
    setExpandedTaskIds(new Set())
  }

  if (captures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Flow</CardTitle>
          <CardDescription>Capture points showing data transformation through the DAG</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No data metrics captured for this run</p>
              <p className="text-sm mt-1">Use the granyt SDK to capture DataFrame metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Flow by Task</CardTitle>
            <CardDescription>
              Data metrics grouped by task execution
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-6 p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tasks</span>
            <span className="text-xl font-bold text-primary">{taskGroups.length}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Captures</span>
            <span className="text-xl font-bold text-primary">{captures.length}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Rows</span>
            <span className="text-xl font-bold text-primary">{totalRowsSum.toLocaleString()}</span>
          </div>
        </div>
        <div className="space-y-0">
          {taskGroups.map((group, index) => (
            <div key={group.taskId}>
              <TaskCard
                group={group}
                isExpanded={expandedTaskIds.has(group.taskId)}
                onToggle={() => toggleExpand(group.taskId)}
              />
              {index < taskGroups.length - 1 && (
                <FlowConnector />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
