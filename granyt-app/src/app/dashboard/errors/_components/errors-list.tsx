"use client"

import { Badge } from "@/components/ui/badge"
import { DataCard } from "@/components/shared"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export interface ErrorItem {
  id: string
  exceptionType: string
  message: string
  status: string
  occurrenceCount: number
  dagCount: number
  firstSeenAt: Date | string
  lastSeenAt: Date | string
}

interface ErrorsListProps {
  errors: ErrorItem[]
  emptyMessage: string
}

function EmptyErrorsState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <CheckCircle className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg font-medium">No open errors</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function ErrorsList({ errors, emptyMessage }: ErrorsListProps) {
  const errorCount = errors?.length ?? 0

  return (
    <DataCard
      title={
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Open Errors
          <span className="text-sm font-normal text-muted-foreground">
            ({errorCount})
          </span>
        </div>
      }
      description={errorCount === 0 ? emptyMessage : `${errorCount} error${errorCount !== 1 ? "s" : ""} requiring attention`}
      isLoading={false}
      count={errorCount}
      emptyState={<EmptyErrorsState message={emptyMessage} />}
    >
      <div className="space-y-3">
        {errors.map((error) => (
          <ErrorListItem key={error.id} error={error} />
        ))}
      </div>
    </DataCard>
  )
}

export function ErrorListItem({ error }: { error: ErrorItem }) {
  return (
    <Link 
      href={`/dashboard/errors/${error.id}`}
      className="block"
    >
      <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-colors">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold">{error.exceptionType}</p>
            <Badge variant="outline" className="text-xs">
              {error.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {error.message}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{error.occurrenceCount} occurrence{error.occurrenceCount !== 1 ? "s" : ""}</span>
            <span>•</span>
            <span>{error.dagCount} DAG{error.dagCount !== 1 ? "s" : ""} affected</span>
            <span>•</span>
            <span>First seen {format(new Date(error.firstSeenAt), "MMM d, yyyy")}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Last seen</p>
          <p className="text-sm font-medium">
            {format(new Date(error.lastSeenAt), "MMM d, HH:mm")}
          </p>
        </div>
      </div>
    </Link>
  )
}
