"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StacktraceView } from "./stacktrace-view"
import { filterUserStacktrace, type StackFrame } from "@/lib/stacktrace"
import { Code2, Layout, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Occurrence } from "./affected-dags-card"

interface SourceErrorCardProps {
  occurrences: Occurrence[]
}

export function SourceErrorCard({ occurrences }: SourceErrorCardProps) {
  const sourceErrors = useMemo(() => {
    const groups = new Map<string, { dagId: string; taskId: string; stacktrace: StackFrame[] }>()

    for (const occ of occurrences) {
      const dagId = occ.dagId || "unknown"
      const taskId = occ.taskId || "unknown"
      const key = `${dagId}:${taskId}`

      if (groups.has(key)) continue

      const userStacktrace = filterUserStacktrace(occ.stacktrace)
      if (userStacktrace.length > 0) {
        groups.set(key, {
          dagId,
          taskId,
          stacktrace: userStacktrace,
        })
      }
    }

    return Array.from(groups.values())
  }, [occurrences])

  if (sourceErrors.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Code2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Source Errors</h3>
        <Badge variant="secondary" className="ml-auto">
          {sourceErrors.length} unique location{sourceErrors.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        {sourceErrors.map((error, idx) => (
          <Card key={idx} className="border-primary/20 bg-primary/5 overflow-hidden">
            <CardHeader className="py-2 px-4 bg-primary/10 border-b border-primary/10">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <Layout className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">DAG</span>
                  <span className="text-sm font-semibold">{error.dagId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Task</span>
                  <span className="text-sm font-semibold">{error.taskId}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-background">
                <StacktraceView stacktrace={error.stacktrace} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
