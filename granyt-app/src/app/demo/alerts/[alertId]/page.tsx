"use client"

import { use } from "react"
import { mockAlertsForPage } from "../../_data/mock-data"
import { 
  AlertDetailHeader, 
  AlertPipelineContext,
  AlertStatusBanner, 
  AlertDetailsCard,
  AlertContextCard,
  UnderstandingAlertCard,
} from "@/app/dashboard/alerts/[alertId]/_components"
import { AlertMetadata, AlertData } from "@/app/dashboard/alerts/[alertId]/_components/types"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function DemoAlertDetailPage({ 
  params 
}: { 
  params: Promise<{ alertId: string }> 
}) {
  const resolvedParams = use(params)
  const alertId = resolvedParams.alertId
  
  const alert = mockAlertsForPage.find(a => a.id === alertId) as unknown as AlertData
  
  if (!alert) {
    return <AlertNotFound />
  }

  const metadata = alert.metadata as AlertMetadata
  const isCritical = alert.severity === "critical"
  const isOpen = alert.status === "OPEN"
  const isAcknowledged = alert.status === "ACKNOWLEDGED"
  const isDismissed = alert.status === "DISMISSED"

  return (
    <div className="space-y-6">
      <AlertDetailHeader alert={alert} basePath="/demo" />
      
      <AlertStatusBanner 
        alert={alert}
        isOpen={isOpen}
        isCritical={isCritical}
        isAcknowledged={isAcknowledged}
        isDismissed={isDismissed}
      />

      <AlertPipelineContext alert={alert} basePath="/demo" />

      <UnderstandingAlertCard 
        alertType={alert.alertType}
        metadata={metadata}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <AlertDetailsCard 
          alertType={alert.alertType}
          metadata={metadata}
        />
        <AlertContextCard alert={alert} basePath="/demo" />
      </div>
    </div>
  )
}

function AlertNotFound() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/demo/alerts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Alerts
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-semibold">Alert Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The alert you are looking for does not exist or has been deleted.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            This is a demo with limited data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
