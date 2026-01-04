"use client"

import { DataCard } from "@/components/shared"
import { Bell, CheckCircle2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { AlertListItem } from "./alert-list-item"
import { useMemo } from "react"

export interface AlertItem {
  id: string
  alertType: string
  srcDagId: string | null
  captureId: string | null
  status: string
  severity: string | null
  metadata?: unknown
  createdAt: Date | string
  acknowledgedAt: Date | string | null
  dismissedAt: Date | string | null
}

interface GroupedAlertsListProps {
  alerts?: AlertItem[]
  isLoading: boolean
  basePath?: string
}

const OPEN_STATUSES = ["OPEN"]

function isOpenAlert(status: string): boolean {
  return OPEN_STATUSES.includes(status)
}

export function GroupedAlertsList({ alerts, isLoading, basePath = "/dashboard" }: GroupedAlertsListProps) {
  const router = useRouter()

  const { openAlerts, closedAlerts } = useMemo(() => {
    if (!alerts) return { openAlerts: [], closedAlerts: [] }
    
    return {
      openAlerts: alerts.filter(a => isOpenAlert(a.status)),
      closedAlerts: alerts.filter(a => !isOpenAlert(a.status)),
    }
  }, [alerts])

  const handleAlertClick = (alertId: string) => {
    router.push(`${basePath}/alerts/${alertId}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DataCard
          title="Open Alerts"
          description="Loading..."
          isLoading={true}
          skeletonHeight="h-20"
          emptyState={<div />}
          count={1}
        >
          <div />
        </DataCard>
      </div>
    )
  }

  const hasNoAlerts = openAlerts.length === 0 && closedAlerts.length === 0

  if (hasNoAlerts) {
    return (
      <DataCard
        title="All Alerts"
        description="No alerts found"
        isLoading={false}
        emptyState={<AlertsEmptyState />}
      >
        <div />
      </DataCard>
    )
  }

  return (
    <div className="space-y-6">
      <AlertGroup
        title="Open Alerts"
        icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
        alerts={openAlerts}
        onAlertClick={handleAlertClick}
        emptyMessage="No open alerts - you're all caught up! 🎉"
      />

      <AlertGroup
        title="Closed Alerts"
        icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
        alerts={closedAlerts}
        onAlertClick={handleAlertClick}
        emptyMessage="No closed alerts yet"
      />
    </div>
  )
}

interface AlertGroupProps {
  title: string
  icon: React.ReactNode
  alerts: AlertItem[]
  onAlertClick: (alertId: string) => void
  emptyMessage: string
}

function AlertGroup({ title, icon, alerts, onAlertClick, emptyMessage }: AlertGroupProps) {
  return (
    <DataCard
      title={
        <div className="flex items-center gap-2">
          {icon}
          {title}
          <span className="text-sm font-normal text-muted-foreground">
            ({alerts.length})
          </span>
        </div>
      }
      description={alerts.length === 0 ? emptyMessage : `${alerts.length} alert${alerts.length !== 1 ? "s" : ""}`}
      isLoading={false}
      count={alerts.length}
      emptyState={
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      }
    >
      <div className="space-y-3">
        {alerts.map((alert) => (
          <AlertListItem
            key={alert.id}
            alert={alert}
            onClick={() => onAlertClick(alert.id)}
          />
        ))}
      </div>
    </DataCard>
  )
}

function AlertsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Bell className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg font-medium">No alerts</p>
      <p className="text-sm">Your DAGs are running smoothly</p>
    </div>
  )
}
