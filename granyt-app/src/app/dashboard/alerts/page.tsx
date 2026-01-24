"use client"

import { trpc } from "@/lib/trpc"
import { useDocumentTitle } from "@/lib/use-document-title"
import { PageHeader } from "@/components/shared"
import { GroupedAlertsList, MetricMonitorsList, AlertSensitivitySettings } from "./_components"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Gauge, Settings } from "lucide-react"
import { AlertType, AlertSensitivity } from "@prisma/client"

export default function AlertsPage() {
  useDocumentTitle("Alerts")

  const { data: alerts, isLoading } = trpc.alerts.getAlerts.useQuery({
    limit: 100,
  })

  const { data: alertSettings, isLoading: settingsLoading } = trpc.alerts.getSettings.useQuery({})
  const updateSettings = trpc.alerts.updateSettings.useMutation()

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
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Alert Settings
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

        <TabsContent value="settings" className="mt-4">
          <AlertSensitivitySettings
            settings={alertSettings}
            isLoading={settingsLoading}
            isPending={updateSettings.isPending}
            onSensitivityChange={(alertType: AlertType, sensitivity: string, customThreshold?: number) =>
              updateSettings.mutate({ alertType, sensitivity: sensitivity as AlertSensitivity, customThreshold })
            }
            onEnabledChange={(alertType: AlertType, enabled: boolean) =>
              updateSettings.mutate({ alertType, enabled })
            }
            onCustomThresholdSave={(customThreshold: number) =>
              updateSettings.mutate({ alertType: "ROW_COUNT_DROP", sensitivity: "CUSTOM", customThreshold })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
