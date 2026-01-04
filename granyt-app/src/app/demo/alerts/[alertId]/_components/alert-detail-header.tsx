"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingDown, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { AlertData } from "./types"

interface AlertDetailHeaderProps {
  alert: AlertData
}

export function AlertDetailHeader({ alert }: AlertDetailHeaderProps) {
  const router = useRouter()
  const isCritical = alert.severity === "critical"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/demo/alerts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {alert.alertType === "ROW_COUNT_DROP" ? (
              <TrendingDown className={cn(
                "h-6 w-6",
                isCritical ? "text-red-500" : "text-amber-500"
              )} />
            ) : (
              <AlertTriangle className={cn(
                "h-6 w-6",
                isCritical ? "text-red-500" : "text-amber-500"
              )} />
            )}
            {alert.alertType.replace(/_/g, " ")}
          </h1>
        </div>
      </div>
    </div>
  )
}
