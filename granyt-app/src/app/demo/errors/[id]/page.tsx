"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { mockErrorDetails, mockRecentErrors } from "../../_data/mock-data"
import {
  ErrorHeaderCard,
  AffectedDagsCard,
  AllOccurrencesCard,
  ErrorEnvironmentBreadcrumb,
  LatestStacktraceCard,
  type ErrorEnvironmentStatus,
} from "@/app/dashboard/errors/[id]/_components"

export default function DemoErrorDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params)
  const errorId = resolvedParams.id
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null)
  
  // Find detailed error data, or fall back to basic error info
  const errorDetails = mockErrorDetails[errorId]
  const basicError = mockRecentErrors.find(e => e.id === errorId)
  
  const error = errorDetails || (basicError ? {
    id: errorId,
    exceptionType: basicError.exceptionType || "Unknown Error",
    message: basicError.message || "Error details not available",
    occurrenceCount: basicError.occurrenceCount || 0,
    firstSeenAt: basicError.firstSeenAt || new Date().toISOString(),
    lastSeenAt: basicError.lastSeenAt || new Date().toISOString(),
    status: basicError.status || "open",
    stacktrace: "Stacktrace not available in basic view",
    occurrences: [],
  } : null)

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

  const uniqueDagCount = occurrencesByDag.length || (basicError?.dagCount || 1)

  // Group occurrences by environment for the environment breadcrumb
  const environmentStatuses: ErrorEnvironmentStatus[] = useMemo(() => {
    if (!error?.occurrences) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const occurrences = error.occurrences as any[]
    if (occurrences.length === 0) return []
    
    const grouped = new Map<string, { count: number; lastSeenAt: Date }>()
    for (const occurrence of occurrences) {
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

  const filteredDagCount = filteredOccurrencesByDag.length

  // Early return after all hooks
  if (!error) {
    return <ErrorNotFound />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/demo/errors">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Errors
            </Button>
          </Link>
        </div>
      </div>

      <ErrorHeaderCard
        error={error}
        uniqueDagCount={uniqueDagCount}
        onUpdateStatus={() => {}}
        isUpdating={false}
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
      <LatestStacktraceCard occurrences={filteredOccurrences} basePath="/demo" />

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
          <AllOccurrencesCard
            occurrences={filteredOccurrences}
            basePath="/demo"
          />
        </TabsContent>

        <TabsContent value="dags">
          <AffectedDagsCard 
            occurrencesByDag={filteredOccurrencesByDag} 
            basePath="/demo"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ErrorNotFound() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/demo/errors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Errors
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Error not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This is a demo with limited data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
