"use client"

import { DataCard, EnvironmentBadge } from "@/components/shared"
import { Bell, AlertTriangle, ChevronRight, TrendingDown, Columns } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getAlertPreviewText } from "@/lib/alert-preview"

export interface NotificationAlert {
  id: string
  alertType: string
  srcDagId: string | null
  captureId?: string | null
  environment?: string | null
  severity: string | null
  metadata?: unknown
  createdAt: Date | string
}

interface NotificationsCardProps {
  alerts: NotificationAlert[] | undefined
  summary?: { total: number; critical: number } | undefined
  isLoading: boolean
  showViewAll?: boolean
  basePath?: string
  maxItems?: number
}

function NotificationItem({ alert, onClick }: { alert: NotificationAlert; onClick: () => void }) {
  const isCritical = alert.severity === "critical"
  
  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
    >
      {alert.alertType === "ROW_COUNT_DROP" ? (
        <TrendingDown className={cn(
          "h-5 w-5 shrink-0 mt-0.5",
          isCritical ? "text-red-500" : "text-orange-500"
        )} />
      ) : alert.alertType === "SCHEMA_CHANGE" ? (
        <Columns className={cn(
          "h-5 w-5 shrink-0 mt-0.5",
          isCritical ? "text-red-500" : "text-orange-500"
        )} />
      ) : (
        <AlertTriangle className={cn(
          "h-5 w-5 shrink-0 mt-0.5",
          isCritical ? "text-red-500" : "text-orange-500"
        )} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm truncate">{alert.srcDagId ?? "System"}</p>
          {alert.environment && (
            <EnvironmentBadge 
              environment={alert.environment}
              variant={isCritical ? "error" : "default"}
              className="text-[10px] px-1 py-0 h-4"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {alert.captureId && <span className="font-mono bg-muted px-1 py-0.5 rounded mr-1">{alert.captureId}</span>}
          {getAlertPreviewText(alert.alertType, alert.metadata)}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span className={cn(
            "px-1.5 py-0.5 rounded",
            isCritical ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500"
          )}>
            {isCritical ? "Critical" : "Warning"}
          </span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  )
}

function EmptyNotificationState() {
  return (
    <div className="flex items-center justify-center h-32 text-muted-foreground">
      <div className="text-center">
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No notifications</p>
      </div>
    </div>
  )
}

export function NotificationsCard({ alerts, summary, isLoading, showViewAll = true, basePath = "/dashboard", maxItems = 2 }: NotificationsCardProps) {
  const router = useRouter()
  const alertCount = alerts?.length ?? 0
  const displayedAlerts = alerts?.slice(0, maxItems) ?? []
  const remainingCount = Math.max(0, alertCount - maxItems)
  const hasMore = remainingCount > 0

  const titleContent = (
    <div className="flex items-center gap-2">
      Notifications
      {summary && summary.total > 0 && (
        <span className={cn(
          "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
          summary.critical > 0 
            ? "bg-red-500/10 text-red-500" 
            : "bg-orange-500/10 text-orange-500"
        )}>
          {summary.total}
        </span>
      )}
    </div>
  )

  return (
    <DataCard
      title={titleContent}
      description="Items requiring your attention"
      isLoading={isLoading}
      emptyState={<EmptyNotificationState />}
      skeletonRows={3}
      count={alertCount}
      headerAction={
        (showViewAll && alertCount > 0) ? (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push(`${basePath}/alerts`)}
            className="text-xs"
          >
            View all
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        ) : null
      }
    >
      <div className="space-y-3">
        {displayedAlerts.map((alert) => (
          <NotificationItem 
            key={alert.id} 
            alert={alert} 
            onClick={() => router.push(`${basePath}/alerts/${alert.id}`)}
          />
        ))}
        {hasMore && (
          <button
            onClick={() => router.push(`${basePath}/alerts`)}
            className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-dashed hover:bg-accent transition-colors text-sm text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            View {remainingCount} more notification{remainingCount !== 1 ? "s" : ""}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </DataCard>
  )
}
