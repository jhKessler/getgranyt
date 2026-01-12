"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { SetupMilestone } from "./types"

interface FlowNodeProps {
  milestone: SetupMilestone
  isActive: boolean
}

export function FlowNode({ milestone, isActive }: FlowNodeProps) {
  return (
    <div className="relative group">
      <div
        className={cn(
          "h-3 w-3 rounded-full transition-all duration-300",
          milestone.isComplete
            ? "bg-emerald-500 scale-100"
            : isActive
              ? "bg-primary animate-pulse"
              : "bg-muted-foreground/30"
        )}
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {milestone.shortLabel}
        {milestone.isComplete && " ✓"}
      </div>
    </div>
  )
}

export function FlowNodeLarge({ milestone, isActive }: FlowNodeProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300",
          milestone.isComplete
            ? "bg-emerald-500 text-white"
            : isActive
              ? "bg-primary text-primary-foreground animate-pulse"
              : "bg-muted text-muted-foreground"
        )}
      >
        {milestone.isComplete ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          milestone.isComplete
            ? "text-emerald-600 dark:text-emerald-400"
            : isActive
              ? "text-foreground"
              : "text-muted-foreground"
        )}
      >
        {milestone.shortLabel}
      </span>
    </div>
  )
}
