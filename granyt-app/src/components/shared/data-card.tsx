"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ReactNode } from "react"

interface DataCardProps {
  title: ReactNode
  description?: ReactNode
  count?: number
  itemName?: string
  isLoading: boolean
  emptyState: ReactNode
  children: ReactNode
  skeletonRows?: number
  skeletonHeight?: string
  className?: string
  headerAction?: ReactNode
}

export function DataCard({
  title,
  description,
  count,
  itemName = "item",
  isLoading,
  emptyState,
  children,
  skeletonRows = 5,
  skeletonHeight = "h-16",
  className,
  headerAction
}: DataCardProps) {
  const displayDescription = description ?? (
    isLoading 
      ? "Loading..." 
      : `${count || 0} ${itemName}${count !== 1 ? "s" : ""} found`
  )

  return (
    <Card className={className}>
      <CardHeader className={headerAction ? "flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6" : "px-4 sm:px-6"}>
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <CardTitle className="text-sm sm:text-lg">{title}</CardTitle>
          <CardDescription className="text-[11px] sm:text-sm">{displayDescription}</CardDescription>
        </div>
        {headerAction}
      </CardHeader>
      <CardContent className={`px-4 sm:px-6 ${headerAction ? "pt-4" : ""}`}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <Skeleton key={i} className={`${skeletonHeight} w-full`} />
            ))}
          </div>
        ) : (!count || count === 0) ? (
          emptyState
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
