"use client"

import { Badge } from "@/components/ui/badge"
import { getEnvironmentBadgeStyle, type EnvironmentColorVariant } from "@/lib/environment-colors"
import { cn } from "@/lib/utils"

interface EnvironmentBadgeProps {
  environment: string | null | undefined
  className?: string
  /**
   * - "default": normal display with environment-specific colors
   * - "error": error context (red for production, orange for others)
   * - "muted": subtle display (gray for all environments)
   */
  variant?: EnvironmentColorVariant
}

export function EnvironmentBadge({ environment, className, variant = "default" }: EnvironmentBadgeProps) {
  const envName = environment || "unknown"

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        getEnvironmentBadgeStyle(environment, variant),
        className
      )}
    >
      {envName}
    </Badge>
  )
}
