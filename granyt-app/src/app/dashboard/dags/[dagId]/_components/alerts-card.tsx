"use client"

import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import Link from "next/link"
import { AlertType, AlertStatus } from "@prisma/client"
import { getAlertPreviewText, getAlertTypeLabel } from "@/lib/alert-preview"
import { formatDistanceToNow } from "date-fns"
import { IssuesCard } from "./issues-card"

// =============================================================================
// Types
// =============================================================================

interface AlertData {
  id: string
  alertType: AlertType
  status: AlertStatus
  severity: string
  srcDagId: string
  captureId: string | null
  createdAt: Date | string
  metadata?: unknown
}

interface AlertsCardProps {
  title: string
  description?: string
  alerts: AlertData[]
  isLoading: boolean
}

// =============================================================================
// Helper Functions
// =============================================================================

function getSeverityVariant(severity: string): "destructive" | "secondary" {
  return severity === "critical" ? "destructive" : "secondary"
}

// =============================================================================
// Sub-components
// =============================================================================

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

// =============================================================================
// Main Component
// =============================================================================

export function AlertsCard({ title, description, alerts, isLoading }: AlertsCardProps) {
  return (
    <IssuesCard
      title={title}
      description={description}
      items={alerts}
      isLoading={isLoading}
      emptyMessage="No open alerts 🎉"
      activeIcon={Bell}
      activeIconClass="text-amber-500"
      renderItem={(alert) => <AlertItem alert={alert} />}
      getItemKey={(alert) => alert.id}
    />
  )
}
