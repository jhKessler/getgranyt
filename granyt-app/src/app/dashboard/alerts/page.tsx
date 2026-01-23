"use client"

import { trpc } from "@/lib/trpc"
import { useDocumentTitle } from "@/lib/use-document-title"
import { PageHeader } from "@/components/shared"
import { GroupedAlertsList, MetricMonitorsList } from "./_components"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Gauge } from "lucide-react"

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

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Active Alerts
          </TabsTrigger>
          <TabsTrigger value="monitors" className="gap-2">
            <Gauge className="h-4 w-4" />
            Metric Monitors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4">
          <GroupedAlertsList
            alerts={alerts}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="monitors" className="mt-4">
          <MetricMonitorsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
