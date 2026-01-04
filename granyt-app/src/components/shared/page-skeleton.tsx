"use client"

import { Skeleton } from "@/components/ui/skeleton"

interface PageSkeletonProps {
  rows?: number
  showHeader?: boolean
}

export function PageSkeleton({ rows = 5, showHeader = true }: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  )
}
