"use client"

import { use } from "react"
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
  SourceErrorCard,
} from "@/app/dashboard/errors/[id]/_components"

export default function DemoErrorDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params)
  const errorId = resolvedParams.id
  
  // Find detailed error data, or fall back to basic error info
  const errorDetails = mockErrorDetails[errorId]
  const basicError = mockRecentErrors.find(e => e.id === errorId)
  
  if (!errorDetails && !basicError) {
    return <ErrorNotFound />
  }

  const error = errorDetails || {
    id: errorId,
    exceptionType: basicError?.exceptionType || "Unknown Error",
    message: basicError?.message || "Error details not available",
    occurrenceCount: basicError?.occurrenceCount || 0,
    firstSeenAt: basicError?.firstSeenAt || new Date().toISOString(),
    lastSeenAt: basicError?.lastSeenAt || new Date().toISOString(),
    status: basicError?.status || "open",
    stacktrace: "Stacktrace not available in basic view",
    occurrences: [],
  }

  const occurrencesByDag = (() => {
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
  })()

  const uniqueDagCount = occurrencesByDag.length || (basicError?.dagCount || 1)

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

      <Tabs defaultValue="dags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dags">Affected DAGs ({uniqueDagCount})</TabsTrigger>
          <TabsTrigger value="occurrences">All Occurrences ({error.occurrenceCount})</TabsTrigger>
          {error.stacktrace && <TabsTrigger value="source">Source</TabsTrigger>}
        </TabsList>

        <TabsContent value="dags">
          <AffectedDagsCard 
            occurrencesByDag={occurrencesByDag} 
            basePath="/demo"
          />
        </TabsContent>

        <TabsContent value="occurrences">
          <AllOccurrencesCard
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            occurrences={error.occurrences as any}
            basePath="/demo"
          />
        </TabsContent>

        {error.stacktrace && (
          <TabsContent value="source">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <SourceErrorCard occurrences={error.occurrences as any} />
          </TabsContent>
        )}
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
