"use client"

import { DataCard, EnvironmentBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"

export interface RecentError {
  id: string
  exceptionType: string
  message: string
  occurrenceCount: number
  dagCount: number
  lastSeenAt: string | Date
  firstSeenAt: string | Date
  status: string
  environments?: string[]
}

interface RecentErrorsCardProps {
  errors: RecentError[]
  isLoading: boolean
  showViewAll?: boolean
  title?: React.ReactNode
  description?: string
  basePath?: string
  maxItems?: number
  viewMoreHref?: string
}

function ErrorListItem({ error, basePath = "/dashboard" }: { error: RecentError; basePath?: string }) {
  return (
    <Link 
      href={`${basePath}/errors/${error.id}`}
      className="block"
    >
      <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm truncate">{error.exceptionType}</p>
            {error.environments && error.environments.length > 0 && (
              <div className="flex gap-1">
                {error.environments.slice(0, 2).map((env) => (
                  <EnvironmentBadge 
                    key={env} 
                    environment={env}
                    variant="error"
                    className="text-[10px] px-1 py-0 h-4"
                  />
                ))}
                {error.environments.length > 2 && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    +{error.environments.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{error.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {error.occurrenceCount} occurrence{error.occurrenceCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {error.dagCount} DAG{error.dagCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(error.lastSeenAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}



function EmptyErrorState() {
  return (
    <div className="flex items-center justify-center h-32 text-muted-foreground">
      <div className="text-center">
        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No open errors</p>
      </div>
    </div>
  )
}

export function RecentErrorsCard({ 
  errors, 
  isLoading, 
  showViewAll = true,
  title = "Recent Errors",
  description = "Latest DAG errors requiring attention",
  basePath = "/dashboard",
  maxItems = 2,
  viewMoreHref
}: RecentErrorsCardProps) {
  const router = useRouter()
  const errorCount = errors?.length ?? 0
  const displayedErrors = errors?.slice(0, maxItems) ?? []
  const remainingCount = Math.max(0, errorCount - maxItems)
  const hasMore = remainingCount > 0
  const errorsHref = viewMoreHref ?? `${basePath}/errors`
  
  const titleContent = typeof title === "string" ? (
    <div className="flex items-center gap-2">
      {title}
      {errorCount > 0 && (
        <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive">
          {errorCount}
        </span>
      )}
    </div>
  ) : title

  return (
    <DataCard
      title={titleContent}
      description={description}
      isLoading={isLoading}
      emptyState={<EmptyErrorState />}
      skeletonRows={3}
      count={errorCount}
      headerAction={
        (showViewAll && errorCount > 0) ? (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push(errorsHref)}
            className="text-xs"
          >
            View all
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        ) : null
      }
    >
      <div className="space-y-3">
        {displayedErrors.map((error) => (
          <ErrorListItem key={error.id} error={error} basePath={basePath} />
        ))}
        {hasMore && (
          <button
            onClick={() => router.push(errorsHref)}
            className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-dashed hover:bg-accent transition-colors text-sm text-muted-foreground hover:text-foreground"
          >
            <AlertTriangle className="h-4 w-4" />
            View {remainingCount} more error{remainingCount !== 1 ? "s" : ""}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </DataCard>
  )
}
