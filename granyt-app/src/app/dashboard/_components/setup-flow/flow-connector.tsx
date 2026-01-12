"use client"

import { cn } from "@/lib/utils"

interface FlowConnectorProps {
  isComplete: boolean
  isActive: boolean
}

export function FlowConnector({ isComplete, isActive }: FlowConnectorProps) {
  return (
    <div className="relative h-0.5 w-6 mx-0.5 overflow-hidden rounded-full bg-muted-foreground/20">
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-all duration-500",
          isComplete ? "w-full bg-emerald-500" : "w-0 bg-primary"
        )}
      />
      {isActive && !isComplete && (
        <div className="absolute inset-y-0 left-0 w-full">
          <div className="h-full w-2 bg-primary/50 animate-flow-pulse rounded-full" />
        </div>
      )}
    </div>
  )
}

export function FlowConnectorLarge({ isComplete, isActive }: FlowConnectorProps) {
  return (
    <div className="relative h-0.5 w-12 mx-1 overflow-hidden rounded-full bg-muted-foreground/20 self-start mt-4">
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-all duration-700 ease-out",
          isComplete ? "w-full bg-emerald-500" : "w-0 bg-primary"
        )}
      />
      {isActive && !isComplete && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="h-full w-3 bg-primary/60 animate-flow-slide rounded-full" />
        </div>
      )}
    </div>
  )
}
