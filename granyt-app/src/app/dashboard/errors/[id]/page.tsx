"use client"

import { use, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trpc } from "@/lib/trpc"
import { useDocumentTitle } from "@/lib/use-document-title"
import { ErrorStatus } from "@/server/services/dashboard/types"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ErrorHeaderCard,
  AffectedDagsCard,
  AllOccurrencesCard,
  SourceErrorCard,
} from "./_components"

export default function ErrorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const utils = trpc.useUtils()
  
  const { data: error, isLoading } = trpc.dashboard.getErrorDetails.useQuery({ 
    errorId: resolvedParams.id 
  })
  
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

  const uniqueDagCount = occurrencesByDag.length

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
      />


      <Tabs defaultValue="dags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dags">Affected DAGs ({uniqueDagCount})</TabsTrigger>
          <TabsTrigger value="occurrences">All Occurrences ({error.occurrenceCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="dags">
          <AffectedDagsCard occurrencesByDag={occurrencesByDag} />
        </TabsContent>

        <TabsContent value="occurrences">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <AllOccurrencesCard occurrences={error.occurrences as any} />
        </TabsContent>
      </Tabs>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <SourceErrorCard occurrences={error.occurrences as any} />
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
