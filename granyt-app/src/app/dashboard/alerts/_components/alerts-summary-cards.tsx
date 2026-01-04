"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface AlertsSummaryCardsProps {
  isLoading: boolean
  summary?: {
    total: number
    critical: number
    warning: number
  }
}

export function AlertsSummaryCards({ isLoading, summary }: AlertsSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Open Alerts</CardDescription>
          <CardTitle className="text-3xl">
            {isLoading ? <Skeleton className="h-9 w-16" /> : summary?.total ?? 0}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {summary?.critical ?? 0} critical
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              {summary?.warning ?? 0} warning
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
