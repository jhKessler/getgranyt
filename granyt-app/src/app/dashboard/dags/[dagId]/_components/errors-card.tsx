"use client"

import { AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { IssuesCard } from "./issues-card"

// =============================================================================
// Types
// =============================================================================

interface DagError {
  id: string
  exceptionType: string
  message: string
  occurrenceCount: number
  lastSeenAt: string | Date
}

interface ErrorsCardProps {
  title: string
  description?: string
  errors: DagError[]
  isLoading: boolean
}

// =============================================================================
// Sub-components
// =============================================================================

function ErrorItem({ error }: { error: DagError }) {
  return (
    <Link href={`/dashboard/errors/${error.id}`} className="block">
      <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{error.exceptionType}</p>
          <p className="text-xs text-muted-foreground truncate mb-1">{error.message}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{error.occurrenceCount} occurrence{error.occurrenceCount !== 1 ? "s" : ""}</span>
            <span>•</span>
            <span>Last seen {formatDistanceToNow(new Date(error.lastSeenAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function ErrorsCard({ title, description, errors, isLoading }: ErrorsCardProps) {
  return (
    <IssuesCard
      title={title}
      description={description}
      items={errors}
      isLoading={isLoading}
      emptyMessage="No open errors"
      activeIcon={AlertTriangle}
      activeIconClass="text-destructive"
      renderItem={(error) => <ErrorItem error={error} />}
      getItemKey={(error) => error.id}
    />
  )
}
