"use client"

import { AlertTriangle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface AlertIndicatorProps {
  alertId: string
  count?: number
  hasCritical?: boolean
  tooltipText?: string
  className?: string
}

export function AlertIndicator({ 
  alertId, 
  count = 1, 
  hasCritical = false,
  tooltipText,
  className,
}: AlertIndicatorProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    router.push(`/dashboard/alerts/${alertId}`)
  }

  const defaultTooltip = count > 1 
    ? `${count} active alerts` 
    : hasCritical 
      ? "Critical alert - Row count dropped to zero"
      : "Alert - Significant row count drop detected"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            "inline-flex items-center justify-center rounded-full p-1 transition-colors",
            "hover:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50",
            className
          )}
          aria-label="View alert"
        >
          <AlertTriangle 
            className={cn(
              "h-4 w-4",
              hasCritical ? "text-red-500" : "text-orange-500"
            )} 
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-sm">{tooltipText || defaultTooltip}</p>
        <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
      </TooltipContent>
    </Tooltip>
  )
}
