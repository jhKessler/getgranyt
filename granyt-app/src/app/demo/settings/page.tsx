"use client"

import { PageHeader, GettingStartedChecklist } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Bell, Settings } from "lucide-react"

export default function DemoSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure notification channels and alert preferences"
      />

      <div className="grid gap-6">
        <GettingStartedChecklist
          setupStatus={{ hasDagRuns: true, hasNotificationChannel: true, hasErrors: true }}
          isLoading={false}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Airflow Settings</CardTitle>
            </div>
            <CardDescription>
              Configure your Airflow URL for each environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Demo mode - Airflow settings are read-only
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Setup</CardTitle>
            </div>
            <CardDescription>
              Configure your email provider. Only one can be active at a time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                Demo: SMTP Configured
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Configure additional notification channels like webhooks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Demo mode - Notification settings are read-only
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
