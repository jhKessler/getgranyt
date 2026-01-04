"use client"

import {
  TableHead,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

interface TableHeadWithTooltipProps {
  children: React.ReactNode
  tooltip: string
  className?: string
}

export function TableHeadWithTooltip({ children, tooltip, className }: TableHeadWithTooltipProps) {
  const isRightAligned = className?.includes("text-right")
  
  return (
    <TableHead className={className}>
      <div className={`flex items-center gap-1 ${isRightAligned ? "justify-end" : ""}`}>
        {children}
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px]">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TableHead>
  )
}
