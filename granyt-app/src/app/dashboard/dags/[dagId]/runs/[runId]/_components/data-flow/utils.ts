import { ColumnInfo, CapturePointInfo, TaskRunInfo, TaskGroup, AggregatedColumn } from "./types"

export function getRowCount(metrics: Record<string, unknown>): number {
  const val = metrics.row_count
  return typeof val === "number" ? val : 0
}

export function getColumnCount(metrics: Record<string, unknown>): number {
  const val = metrics.column_count
  return typeof val === "number" ? val : 0
}

export function getMemoryBytes(metrics: Record<string, unknown>): number | null {
  const val = metrics.memory_bytes
  return typeof val === "number" ? val : null
}

export function getColumns(metrics: Record<string, unknown>): ColumnInfo[] {
  const val = metrics.columns
  if (!Array.isArray(val)) return []
  return val.map((col: Record<string, unknown>) => ({
    name: String(col.name ?? ""),
    dtype: String(col.dtype ?? ""),
    nullCount: typeof col.null_count === "number" ? col.null_count : null,
    emptyStringCount: typeof col.empty_string_count === "number" ? col.empty_string_count : null,
  }))
}

export function getCustomMetrics(metrics: Record<string, unknown>): Record<string, number> {
  const standardFields = new Set(["row_count", "column_count", "memory_bytes", "dataframe_type", "columns", "upstream"])
  const custom: Record<string, number> = {}
  for (const [key, val] of Object.entries(metrics)) {
    if (!standardFields.has(key) && typeof val === "number") {
      custom[key] = val
    }
  }
  return custom
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "-"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function getShortTaskId(taskId: string): string {
  const parts = taskId.split(".")
  return parts.length > 1 ? parts[parts.length - 1] : taskId
}

export function groupCapturesByTask(captures: CapturePointInfo[], tasks: TaskRunInfo[]): TaskGroup[] {
  if (captures.length === 0) return []

  const taskStatusMap = new Map<string, string>()
  for (const task of tasks) {
    taskStatusMap.set(task.srcTaskId, task.status)
  }

  const taskMap = new Map<string, CapturePointInfo[]>()

  for (const capture of captures) {
    const existing = taskMap.get(capture.taskId) || []
    existing.push(capture)
    taskMap.set(capture.taskId, existing)
  }

  const groups: TaskGroup[] = []
  for (const [taskId, taskCaptures] of taskMap) {
    const sorted = taskCaptures.sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    )
    groups.push({
      taskId,
      status: taskStatusMap.get(taskId) || null,
      captures: sorted,
      totalRows: sorted.reduce((sum, c) => sum + getRowCount(c.metrics), 0),
      totalColumns: sorted.reduce((sum, c) => sum + getColumnCount(c.metrics), 0),
      earliestCapture: sorted[0].capturedAt,
    })
  }

  return groups.sort(
    (a, b) => new Date(a.earliestCapture).getTime() - new Date(b.earliestCapture).getTime()
  )
}

export function aggregateColumns(captures: CapturePointInfo[]): AggregatedColumn[] {
  const columnMap = new Map<string, AggregatedColumn>()

  for (const capture of captures) {
    const cols = getColumns(capture.metrics)
    for (const col of cols) {
      const existing = columnMap.get(col.name)
      if (existing) {
        existing.totalNulls += col.nullCount || 0
        existing.totalEmpty += col.emptyStringCount || 0
      } else {
        columnMap.set(col.name, {
          name: col.name,
          dtype: col.dtype,
          totalNulls: col.nullCount || 0,
          totalEmpty: col.emptyStringCount || 0,
        })
      }
    }
  }

  return Array.from(columnMap.values())
}

export function aggregateCustomMetrics(captures: CapturePointInfo[]): Record<string, number> {
  const metrics: Record<string, number> = {}

  for (const capture of captures) {
    const customMetrics = getCustomMetrics(capture.metrics)
    for (const [key, value] of Object.entries(customMetrics)) {
      if (key in metrics) {
        metrics[key] += value
      } else {
        metrics[key] = value
      }
    }
  }

  return metrics
}
