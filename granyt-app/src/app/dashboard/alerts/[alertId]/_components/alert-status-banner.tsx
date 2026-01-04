"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { AlertData } from "./types"

interface AlertStatusBannerProps {
  alert: AlertData
  isOpen: boolean
  isCritical: boolean
  isAcknowledged: boolean
  isDismissed: boolean
  isPending?: boolean
  onReopen?: () => void
}

export function AlertStatusBanner({ 
  alert, 
  isOpen, 
  isCritical, 
  isAcknowledged, 
  isDismissed,
  isPending,
  onReopen,
}: AlertStatusBannerProps) {
  return (
    <Card className={cn(
      isOpen && isCritical && "border-red-500/30 bg-red-500/5",
      isOpen && !isCritical && "border-amber-500/30 bg-amber-500/5",
      isAcknowledged && "border-muted",
      isDismissed && "border-muted"
    )}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn(
              "text-sm px-3 py-1",
              isOpen && isCritical && "bg-red-500/10 text-red-500 border-red-500/20",
              isOpen && !isCritical && "bg-amber-500/10 text-amber-600 border-amber-500/20",
              isAcknowledged && "bg-muted text-muted-foreground",
              isDismissed && "bg-muted text-muted-foreground"
            )}>
              {alert.status.replace("_", " ")}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {alert.dismissReason && (
              <span className="text-sm text-muted-foreground">
                Reason: {alert.dismissReason.replace("_", " ")}
              </span>
            )}
            {isDismissed && onReopen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReopen}
                disabled={isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reopen
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
