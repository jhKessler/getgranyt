"use client"

import { trpc } from "@/lib/trpc"
import { useDocumentTitle } from "@/lib/use-document-title"
import { PageHeader } from "@/components/shared"
import { GroupedAlertsList } from "./_components"

export default function AlertsPage() {
  useDocumentTitle("Alerts")
  
  const { data: alerts, isLoading } = trpc.alerts.getAlerts.useQuery({
    limit: 100,
  })

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Alerts"
        description="Monitor and manage alerts for your DAGs"
      />

      <GroupedAlertsList 
        alerts={alerts} 
        isLoading={isLoading} 
      />
    </div>
  )
}
