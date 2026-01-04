"use client"

import { DataCard } from "@/components/shared"
import { ErrorsList } from "./errors-list"
import { CheckCircle } from "lucide-react"

interface ErrorItem {
  id: string
  exceptionType: string
  message: string
  status: string
  occurrenceCount: number
  dagCount: number
  firstSeenAt: Date | string
  lastSeenAt: Date | string
}

interface SingleEnvErrorsCardProps {
  errors: ErrorItem[]
}

export function SingleEnvErrorsCard({ errors }: SingleEnvErrorsCardProps) {
  return (
    <DataCard
      title="Open Errors"
      description={`${errors.length} error${errors.length !== 1 ? "s" : ""} requiring attention`}
      isLoading={false}
      count={errors.length}
      emptyState={
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
          <p className="text-lg font-medium">No open errors</p>
          <p className="text-sm">All your DAGs are running smoothly</p>
        </div>
      }
    >
      <ErrorsList 
        errors={errors} 
        emptyMessage=""
      />
    </DataCard>
  )
}
