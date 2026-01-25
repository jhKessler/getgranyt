"use client"

import { trpc } from "@/lib/trpc"
import { useDocumentTitle } from "@/lib/use-document-title"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared"
import { GroupedAlertsList, MetricMonitorsList, AlertSensitivitySettings } from "./_components"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Gauge, Settings } from "lucide-react"
import { AlertType } from "@prisma/client"

export default function AlertsPage() {
  useDocumentTitle("Alerts")

  const { data: alerts, isLoading } = trpc.alerts.getAlerts.useQuery({
    limit: 100,
  })

  // Fetch organizations and environments for the environment selector
  const { data: organizations } = trpc.organization.list.useQuery()
  const organizationId = organizations?.[0]?.id
  const { data: environments } = trpc.organization.listEnvironments.useQuery(
    { organizationId: organizationId! },
    { enabled: !!organizationId }
  )

  const utils = trpc.useUtils()
  const { data: alertSettings, isLoading: settingsLoading } = trpc.alerts.getSettings.useQuery({})
  const updateSettings = trpc.alerts.updateSettings.useMutation({
    onSuccess: () => {
      utils.alerts.getSettings.invalidate()
      toast.success("Alert settings updated")
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`)
    }
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
            environments={environments}
            onEnabledChange={(alertType: AlertType, enabled: boolean) =>
              updateSettings.mutate({ alertType, enabled })
            }
            onCustomThresholdSave={(customThreshold: number) =>
              updateSettings.mutate({ alertType: "ROW_COUNT_DROP", sensitivity: "CUSTOM", customThreshold })
            }
            onEnvironmentsChange={(alertType: AlertType, enabledEnvironments: string[]) =>
              updateSettings.mutate({ alertType, enabledEnvironments })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
