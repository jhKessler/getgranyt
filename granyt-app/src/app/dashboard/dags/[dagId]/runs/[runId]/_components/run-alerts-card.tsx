"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { AlertType, AlertStatus } from "@prisma/client"
import { getAlertPreviewText, getAlertTypeLabel } from "@/lib/alert-preview"
import { formatDistanceToNow } from "date-fns"

interface AlertData {
  id: string
  alertType: AlertType
  status: AlertStatus
  severity: string
  srcDagId: string | null
  captureId: string | null
  createdAt: Date | string
  metadata?: unknown
}

interface RunAlertsCardProps {
  alerts: AlertData[]
  isLoading: boolean
  errorId?: string | null
}

const _ALERT_TYPE_LABELS: Record<AlertType, string> = {
  ROW_COUNT_DROP: "Row Count Drop",
  NULL_OCCURRENCE: "Null Occurrence",
  SCHEMA_CHANGE: "Schema Change",
  INTEGRATION_ERROR: "Integration Error",
}

function getSeverityVariant(severity: string): "destructive" | "secondary" {
  return severity === "critical" ? "destructive" : "secondary"
}

function AlertItem({ alert }: { alert: AlertData }) {
  return (
    <Link href={`/dashboard/alerts/${alert.id}`} className="block">
      <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
        <Bell className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm">{getAlertTypeLabel(alert.alertType)}</p>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {getAlertPreviewText(alert.alertType, alert.metadata)}
          </p>
        </div>
        <Badge variant={getSeverityVariant(alert.severity)}>{alert.severity}</Badge>
      </div>
    </Link>
  )
}

function EmptyState() {
  return <p className="text-sm text-muted-foreground">No alerts for this run 🎉</p>
}

function ErrorLink({ errorId }: { errorId: string }) {
  return (
    <Link href={`/dashboard/errors/${errorId}`}>
      <Button variant="destructive" size="sm" className="gap-2">
        <AlertCircle className="h-4 w-4" />
        View Error Details
        <ExternalLink className="h-3 w-3" />
      </Button>
    </Link>
  )
}

export function RunAlertsCard({ alerts, isLoading, errorId }: RunAlertsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const hasAlerts = alerts.length > 0
  const Icon = hasAlerts ? Bell : CheckCircle
  const iconClass = hasAlerts ? "text-amber-500" : "text-green-500"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${iconClass}`} />
              Alerts {hasAlerts && `(${alerts.length})`}
            </CardTitle>
            <CardDescription>Alerts triggered by this run</CardDescription>
          </div>
          {errorId && <ErrorLink errorId={errorId} />}
        </div>
      </CardHeader>
      <CardContent>
        {hasAlerts ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  )
}
