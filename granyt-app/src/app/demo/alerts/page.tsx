"use client"

import { PageHeader } from "@/components/shared"
import { mockAlertsForPage } from "../_data/mock-data"
import { GroupedAlertsList } from "@/app/dashboard/alerts/_components"

export default function DemoAlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Alerts"
        description="Monitor and manage alerts for your DAGs"
      />

      <GroupedAlertsList 
        alerts={mockAlertsForPage} 
        isLoading={false}
        basePath="/demo"
      />
    </div>
  )
}
