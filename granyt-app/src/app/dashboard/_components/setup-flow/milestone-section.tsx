"use client"

import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface MilestoneSectionProps {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  isComplete: boolean
  isExpanded: boolean
  onToggle: () => void
  expandable?: boolean
  children?: React.ReactNode
}

export function MilestoneSection({
  icon: Icon,
  label,
  description,
  isComplete,
  isExpanded,
  onToggle,
  expandable = true,
  children,
}: MilestoneSectionProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={expandable ? onToggle : undefined}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
          isComplete ? "bg-emerald-500/5" : "hover:bg-muted/50",
          expandable && "cursor-pointer"
        )}
        disabled={!expandable}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
            isComplete
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isComplete ? (
            <Check className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium",
              isComplete && "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {label}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        {expandable && !isComplete && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        )}
      </CollapsibleTrigger>

      {expandable && children && (
        <CollapsibleContent className="px-3 pb-3 pl-14">
          {children}
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
