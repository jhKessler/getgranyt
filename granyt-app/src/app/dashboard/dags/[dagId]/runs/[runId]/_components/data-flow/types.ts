export interface ColumnInfo {
  name: string
  dtype: string
  nullCount: number | null
  emptyStringCount: number | null
}

export interface CapturePointInfo {
  id: string
  captureId: string
  taskId: string
  metrics: Record<string, unknown>
  capturedAt: string
}

export interface TaskRunInfo {
  id: string
  srcTaskId: string
  status: string
}

export interface TaskGroup {
  taskId: string
  status: string | null
  captures: CapturePointInfo[]
  totalRows: number
  totalColumns: number
  earliestCapture: string
}

export interface AggregatedColumn {
  name: string
  dtype: string
  totalNulls: number
  totalEmpty: number
}

export interface DataFlowFunnelProps {
  captures: CapturePointInfo[]
  tasks: TaskRunInfo[]
}
