"use client"

import { use, useMemo, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trpc } from "@/lib/trpc"
import { useDocumentTitle } from "@/lib/use-document-title"
import { useBreadcrumbContext } from "@/lib/breadcrumb-context"
import { ErrorStatus } from "@/server/services/dashboard/types"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ErrorHeaderCard,
  ErrorActions,
  AffectedDagsCard,
  AllOccurrencesCard,
  ErrorEnvironmentBreadcrumb,
  LatestStacktraceCard,
  type ErrorEnvironmentStatus,
} from "./_components"

export default function ErrorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const utils = trpc.useUtils()
  const { setOverride, clearOverride } = useBreadcrumbContext()
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null)
  
  const { data: error, isLoading } = trpc.dashboard.getErrorDetails.useQuery({ 
    errorId: resolvedParams.id 
  })
  
  // Set breadcrumb override when error data is available
  useEffect(() => {
    if (error?.exceptionType) {
      setOverride(resolvedParams.id, error.exceptionType)
    }
    return () => {
      clearOverride(resolvedParams.id)
    }
  }, [error?.exceptionType, resolvedParams.id, setOverride, clearOverride])
  
  // Use error type as subtitle if available
  useDocumentTitle(error?.exceptionType ?? "Error Details", "Error")
  
  const updateStatus = trpc.dashboard.updateErrorStatus.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`Error marked as ${variables.status.toLowerCase()}`)
      utils.dashboard.getErrorDetails.invalidate({ errorId: resolvedParams.id })
      utils.dashboard.getRecentErrors.invalidate()
    },
    onError: (error) => {
      toast.error(`Failed to update error status: ${error.message}`)
    },
  })

  const occurrencesByDag = useMemo(() => {
    if (!error?.occurrences) return []
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grouped = new Map<string, any[]>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const occurrence of (error.occurrences as any)) {
      const dagId = occurrence.dagId || "unknown"
      if (!grouped.has(dagId)) {
        grouped.set(dagId, [])
      }
      grouped.get(dagId)!.push(occurrence)
    }
    
    return Array.from(grouped.entries()).map(([dagId, occurrences]) => ({
      dagId,
      occurrences,
      occurrenceCount: occurrences.length,
    }))
  }, [error?.occurrences])

  // Group occurrences by environment for the environment breadcrumb
  const environmentStatuses = useMemo<ErrorEnvironmentStatus[]>(() => {
    if (!error?.occurrences) return []
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grouped = new Map<string, { count: number; lastSeenAt: Date }>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const occurrence of (error.occurrences as any)) {
      const env = occurrence.environment || "unknown"
      const timestamp = new Date(occurrence.timestamp)
      
      if (!grouped.has(env)) {
        grouped.set(env, { count: 0, lastSeenAt: timestamp })
      }
      
      const current = grouped.get(env)!
      current.count++
      if (timestamp > current.lastSeenAt) {
        current.lastSeenAt = timestamp
      }
    }
    
    return Array.from(grouped.entries()).map(([environment, data]) => ({
      environment,
      occurrenceCount: data.count,
      lastSeenAt: data.lastSeenAt,
    }))
  }, [error?.occurrences])

  // Filter occurrences by selected environment
  const filteredOccurrences = useMemo(() => {
    if (!error?.occurrences) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const occurrences = error.occurrences as any[]
    
    if (selectedEnv === null) return occurrences
    return occurrences.filter(o => o.environment === selectedEnv)
  }, [error?.occurrences, selectedEnv])

  // Filter occurrencesByDag by selected environment
  const filteredOccurrencesByDag = useMemo(() => {
    if (selectedEnv === null) return occurrencesByDag
    
    return occurrencesByDag
      .map(dagGroup => ({
        ...dagGroup,
        occurrences: dagGroup.occurrences.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (o: any) => o.environment === selectedEnv
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        occurrenceCount: dagGroup.occurrences.filter((o: any) => o.environment === selectedEnv).length,
      }))
      .filter(dagGroup => dagGroup.occurrenceCount > 0)
  }, [occurrencesByDag, selectedEnv])

  const uniqueDagCount = occurrencesByDag.length
  const filteredDagCount = filteredOccurrencesByDag.length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!error) {
    return <ErrorNotFound />
  }

  const handleUpdateStatus = (status: ErrorStatus) => {
    updateStatus.mutate({ errorId: error.id, status })
  }

  return (
    <div className="space-y-6">
      <BackButton />

      <ErrorHeaderCard
        error={error}
        uniqueDagCount={uniqueDagCount}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={updateStatus.isPending}
        showActions={false}
      />

      {/* Environment selector */}
      {environmentStatuses.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Filter by Environment</h3>
          <ErrorEnvironmentBreadcrumb
            statuses={environmentStatuses}
            selectedEnv={selectedEnv}
            onSelectEnv={setSelectedEnv}
          />
        </div>
      )}

      {/* Latest Stacktrace */}
      <LatestStacktraceCard occurrences={filteredOccurrences} />

      {/* Actions */}
      <ErrorActions 
        status={error.status} 
        onUpdateStatus={handleUpdateStatus} 
        isUpdating={updateStatus.isPending} 
      />

      <Tabs defaultValue="occurrences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="occurrences">
            All Occurrences ({filteredOccurrences.length})
          </TabsTrigger>
          <TabsTrigger value="dags">
            Affected DAGs ({selectedEnv ? filteredDagCount : uniqueDagCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="occurrences">
          <AllOccurrencesCard occurrences={filteredOccurrences} />
        </TabsContent>

        <TabsContent value="dags">
          <AffectedDagsCard occurrencesByDag={filteredOccurrencesByDag} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BackButton() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard/errors">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Errors
        </Button>
      </Link>
    </div>
  )
}

function ErrorNotFound() {
  return (
    <div className="space-y-6">
      <BackButton />
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Error not found</p>
        </CardContent>
      </Card>
    </div>
  )
}
