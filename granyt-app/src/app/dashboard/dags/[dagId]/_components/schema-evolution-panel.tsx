"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { Plus, Minus, RefreshCw, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SchemaColumn {
  name: string
  dtype: string
}

interface SchemaChange {
  type: "added" | "removed" | "dtype_changed"
  columnName: string
  oldDtype?: string
  newDtype?: string
  firstSeenRunId: string
  firstSeenSrcRunId: string
  firstSeenTime: string
}

interface SchemaSnapshot {
  runId: string
  srcRunId: string
  startTime: string
  columns: SchemaColumn[]
}

interface CaptureSchemaEvolution {
  captureId: string
  taskId: string
  currentColumns: SchemaColumn[]
  changes: SchemaChange[]
  snapshots: SchemaSnapshot[]
}

interface SchemaEvolutionPanelProps {
  schemaData: CaptureSchemaEvolution[]
  isLoading: boolean
}

function getShortTaskId(captureId: string): string {
  const parts = captureId.split(".")
  return parts.length > 1 ? parts[parts.length - 1] : captureId
}

function ChangeIcon({ type }: { type: SchemaChange["type"] }) {
  switch (type) {
    case "added":
      return <Plus className="h-3 w-3" />
    case "removed":
      return <Minus className="h-3 w-3" />
    case "dtype_changed":
      return <RefreshCw className="h-3 w-3" />
  }
}

function ChangeBadge({ change }: { change: SchemaChange }) {
  const variants: Record<SchemaChange["type"], { className: string; label: string }> = {
    added: { className: "bg-green-500/10 text-green-600 border-green-500/20", label: "Added" },
    removed: { className: "bg-red-500/10 text-red-600 border-red-500/20", label: "Removed" },
    dtype_changed: { className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Type Changed" },
  }

  const { className, label } = variants[change.type]

  return (
    <Badge variant="outline" className={cn("text-xs gap-1", className)}>
      <ChangeIcon type={change.type} />
      {label}
    </Badge>
  )
}

function SchemaTimeline({ snapshots, changes }: { snapshots: SchemaSnapshot[]; changes: SchemaChange[] }) {
  if (snapshots.length === 0) return null

  // Group snapshots into "eras" based on schema changes
  const changesByRun = new Map<string, SchemaChange[]>()
  for (const change of changes) {
    const existing = changesByRun.get(change.firstSeenRunId) || []
    existing.push(change)
    changesByRun.set(change.firstSeenRunId, existing)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {snapshots.map((snapshot, index) => {
          const runChanges = changesByRun.get(snapshot.runId) || []
          const hasChanges = runChanges.length > 0

          return (
            <div key={snapshot.runId} className="flex items-center">
              {index > 0 && (
                <div className={cn(
                  "h-0.5 w-4",
                  hasChanges ? "bg-yellow-500" : "bg-muted"
                )} />
              )}
              <div
                className={cn(
                  "flex flex-col items-center p-2 rounded border min-w-[80px]",
                  hasChanges 
                    ? "border-yellow-500 bg-yellow-500/5" 
                    : "border-muted bg-muted/30"
                )}
              >
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(snapshot.startTime), "MMM d")}
                </span>
                <span className="text-xs font-medium">
                  {snapshot.columns.length} cols
                </span>
                {hasChanges && (
                  <div className="flex gap-0.5 mt-1">
                    {runChanges.slice(0, 3).map((c, i) => (
                      <span key={i} className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        c.type === "added" && "bg-green-500",
                        c.type === "removed" && "bg-red-500",
                        c.type === "dtype_changed" && "bg-yellow-500"
                      )} />
                    ))}
                    {runChanges.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">+{runChanges.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ColumnList({ columns, changes }: { columns: SchemaColumn[]; changes: SchemaChange[] }) {
  const recentChanges = useMemo(() => {
    const changeMap = new Map<string, SchemaChange>()
    // Get the most recent change for each column
    for (const change of changes) {
      changeMap.set(change.columnName, change)
    }
    return changeMap
  }, [changes])

  // Include removed columns that aren't in current schema
  const removedColumns = changes
    .filter(c => c.type === "removed" && !columns.some(col => col.name === c.columnName))
    .map(c => ({ name: c.columnName, dtype: c.oldDtype || "unknown", isRemoved: true }))

  const allColumns = [
    ...columns.map(c => ({ ...c, isRemoved: false })),
    ...removedColumns,
  ]

  return (
    <div className="space-y-1">
      {allColumns.map((col) => {
        const change = recentChanges.get(col.name)
        return (
          <div
            key={col.name}
            className={cn(
              "flex items-center justify-between py-1.5 px-2 rounded text-sm",
              col.isRemoved && "opacity-50 line-through",
              change?.type === "added" && "bg-green-500/5 border-l-2 border-green-500",
              change?.type === "removed" && "bg-red-500/5 border-l-2 border-red-500",
              change?.type === "dtype_changed" && "bg-yellow-500/5 border-l-2 border-yellow-500",
              !change && "bg-muted/30"
            )}
          >
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono">{col.name}</code>
              {change && <ChangeBadge change={change} />}
            </div>
            <div className="flex items-center gap-2">
              {change?.type === "dtype_changed" && change.oldDtype && (
                <>
                  <code className="text-xs text-muted-foreground line-through">{change.oldDtype}</code>
                  <span className="text-muted-foreground">→</span>
                </>
              )}
              <code className="text-xs text-muted-foreground">
                {change?.type === "dtype_changed" ? change.newDtype : col.dtype}
              </code>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function SchemaEvolutionPanel({ schemaData, isLoading }: SchemaEvolutionPanelProps) {
  const [selectedCapture, setSelectedCapture] = useState<string | null>(null)

  // Auto-select first capture with changes, or first capture
  const defaultCapture = useMemo(() => {
    const withChanges = schemaData.find(s => s.changes.length > 0)
    return withChanges?.captureId || schemaData[0]?.captureId || null
  }, [schemaData])

  const activeCapture = selectedCapture || defaultCapture
  const captureData = schemaData.find(s => s.captureId === activeCapture)

  const totalChanges = useMemo(() => {
    return schemaData.reduce((sum, s) => sum + s.changes.length, 0)
  }, [schemaData])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schema Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!schemaData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schema Evolution</CardTitle>
          <CardDescription>Track column changes across DAG runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            No data metrics captured yet
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
            <CardTitle className="flex items-center gap-2">
              Schema Evolution
              {totalChanges > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {totalChanges} change{totalChanges !== 1 && "s"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Track column additions, removals, and type changes</CardDescription>
          </div>
          {schemaData.length > 1 && (
            <Select value={activeCapture || ""} onValueChange={setSelectedCapture}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select capture point" />
              </SelectTrigger>
              <SelectContent>
                {schemaData.map((s) => (
                  <SelectItem key={s.captureId} value={s.captureId}>
                    <div className="flex items-center gap-2">
                      <span>{getShortTaskId(s.captureId)}</span>
                      {s.changes.length > 0 && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {s.changes.length}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {captureData && (
          <>
            {/* Schema Timeline */}
            {captureData.snapshots.length > 1 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Schema Timeline</h4>
                <SchemaTimeline 
                  snapshots={captureData.snapshots} 
                  changes={captureData.changes} 
                />
              </div>
            )}

            {/* Change Summary */}
            {captureData.changes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Changes</h4>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {captureData.changes.map((change, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                        <div className="flex items-center gap-2">
                          <ChangeBadge change={change} />
                          <code className="font-mono text-xs">{change.columnName}</code>
                          {change.type === "dtype_changed" && (
                            <span className="text-xs text-muted-foreground">
                              ({change.oldDtype} → {change.newDtype})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(change.firstSeenTime), "MMM d, HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Current Schema */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Current Schema ({captureData.currentColumns.length} columns)
              </h4>
              <ScrollArea className="h-[180px]">
                <ColumnList 
                  columns={captureData.currentColumns} 
                  changes={captureData.changes} 
                />
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
