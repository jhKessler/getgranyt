"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type EnvironmentBadgeVariant = "default" | "error" | "muted"

interface EnvironmentBadgeProps {
  environment: string | null | undefined
  className?: string
  /** 
   * - "default": normal display (orange for production, blue for others)
   * - "error": error context (red for production, orange for others)  
   * - "muted": subtle display (gray for all environments)
   */
  variant?: EnvironmentBadgeVariant
}

const variantStyles: Record<EnvironmentBadgeVariant, { production: string; other: string }> = {
  default: {
    production: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    other: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  error: {
    production: "bg-red-500/10 text-red-500 border-red-500/20",
    other: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  muted: {
    production: "bg-muted text-muted-foreground border-muted-foreground/20",
    other: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
}

export function EnvironmentBadge({ environment, className, variant = "default" }: EnvironmentBadgeProps) {
  const envName = environment || "unknown"
  const isProduction = envName === "production"
  const styles = variantStyles[variant]
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "capitalize",
        isProduction ? styles.production : styles.other,
        className
      )}
    >
      {envName}
    </Badge>
  )
}
