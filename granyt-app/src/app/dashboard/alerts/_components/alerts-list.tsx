"use client"

import { DataCard, EmptyState } from "@/components/shared"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { AlertListItem } from "./alert-list-item"

interface Alert {
  id: string
  alertType: string
  srcDagId: string
  captureId: string | null
  status: string
  severity: string | null
  metadata?: unknown
  createdAt: Date | string
  acknowledgedAt: Date | string | null
  dismissedAt: Date | string | null
}

interface AlertsListProps {
  alerts?: Alert[]
  isLoading: boolean
}

export function AlertsList({ alerts, isLoading }: AlertsListProps) {
  const router = useRouter()

  return (
    <DataCard
      title="All Alerts"
      description={isLoading ? "Loading..." : `${alerts?.length || 0} alert${alerts?.length !== 1 ? "s" : ""}`}
      isLoading={isLoading}
      emptyState={
        <EmptyState 
          icon={Bell}
          title="No alerts"
          description="Your DAGs are running smoothly"
        />
      }
      skeletonHeight="h-20"
    >
      <div className="space-y-3">
        {alerts?.map((alert) => (
          <AlertListItem
            key={alert.id}
            alert={alert}
            onClick={() => router.push(`/dashboard/alerts/${alert.id}`)}
          />
        ))}
      </div>
    </DataCard>
  )
}
