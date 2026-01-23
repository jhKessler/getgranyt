"use client"

import { Badge } from "@/components/ui/badge"
import {
  TrendingDown,
  AlertTriangle,
  Columns,
  Activity,
  Gauge,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { getAlertPreviewText } from "@/lib/alert-preview"
import { AlertMetadata, STATUS_CONFIG, AlertStatus } from "./types"

interface Alert {
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

interface AlertListItemProps {
  alert: Alert
  onClick: () => void
}

export function AlertListItem({ alert, onClick }: AlertListItemProps) {
  const metadata = alert.metadata as AlertMetadata
  const isCritical = alert.severity === "critical"
  const config = STATUS_CONFIG[alert.status as AlertStatus]

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors",
        "border hover:bg-muted/50",
        alert.status === "OPEN" && (isCritical ? "border-red-500/30" : "border-orange-500/30")
      )}
    >
      <AlertIcon 
        alertType={alert.alertType}
        status={alert.status}
        isCritical={isCritical}
      />
      
      <div className="flex-1 min-w-0">
        <AlertItemHeader 
          srcDagId={alert.srcDagId}
          status={alert.status}
          isCritical={isCritical}
          config={config}
        />
        
        <AlertItemDescription 
          alertType={alert.alertType}
          captureId={alert.captureId}
          metadata={metadata}
        />
        
        <AlertItemTimestamps 
          createdAt={alert.createdAt}
          acknowledgedAt={alert.acknowledgedAt}
          dismissedAt={alert.dismissedAt}
        />
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">Created</p>
        <p className="text-sm font-medium">
          {format(new Date(alert.createdAt), "MMM d, HH:mm")}
        </p>
      </div>
    </div>
  )
}

interface AlertIconProps {
  alertType: string
  status: string
  isCritical: boolean
}

function AlertIcon({ alertType, status, isCritical }: AlertIconProps) {
  const iconClassName = cn(
    "h-5 w-5 shrink-0 mt-1",
    status === "OPEN"
      ? (isCritical ? "text-red-500" : "text-orange-500")
      : "text-muted-foreground"
  )

  if (alertType === "ROW_COUNT_DROP") {
    return <TrendingDown className={iconClassName} />
  }
  if (alertType === "SCHEMA_CHANGE") {
    return <Columns className={iconClassName} />
  }
  if (alertType === "INTEGRATION_ERROR") {
    return <AlertTriangle className={cn(iconClassName, "text-red-500")} />
  }
  if (alertType === "CUSTOM_METRIC_DROP") {
    return <Gauge className={iconClassName} />
  }
  if (alertType === "CUSTOM_METRIC_DEGRADATION") {
    return <Activity className={cn(iconClassName, status === "OPEN" ? "text-purple-500" : "")} />
  }
  return <AlertTriangle className={iconClassName} />
}

interface AlertItemHeaderProps {
  srcDagId: string | null
  status: string
  isCritical: boolean
  config?: { label: string; color: string }
}

function AlertItemHeader({ srcDagId, status, isCritical, config }: AlertItemHeaderProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-1">
      <span className="font-semibold">{srcDagId ?? "System"}</span>
      <Badge variant="outline" className={cn(
        "text-xs",
        isCritical && status === "OPEN"
          ? "bg-red-500/10 text-red-500 border-red-500/20" 
          : status === "OPEN"
            ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
            : config?.color
      )}>
        {status === "OPEN" 
          ? (isCritical ? "Critical" : "Warning")
          : config?.label
        }
      </Badge>
    </div>
  )
}

interface AlertItemDescriptionProps {
  alertType: string
  captureId: string | null
  metadata?: AlertMetadata
}

function AlertItemDescription({ alertType, captureId, metadata }: AlertItemDescriptionProps) {
  return (
    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
      {captureId && <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded mr-2">{captureId}</span>}
      {getAlertPreviewText(alertType, metadata)}
    </p>
  )
}

interface AlertItemTimestampsProps {
  createdAt: Date | string
  acknowledgedAt: Date | string | null
  dismissedAt: Date | string | null
}

function AlertItemTimestamps({ createdAt, acknowledgedAt, dismissedAt }: AlertItemTimestampsProps) {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
      {acknowledgedAt && (
        <>
          <span>•</span>
          <span>Acknowledged {formatDistanceToNow(new Date(acknowledgedAt), { addSuffix: true })}</span>
        </>
      )}
      {dismissedAt && (
        <>
          <span>•</span>
          <span>Dismissed {formatDistanceToNow(new Date(dismissedAt), { addSuffix: true })}</span>
        </>
      )}
    </div>
  )
}
