"use client"

import { ArrowDown } from "lucide-react"

export function FlowConnector() {
  return (
    <div className="flex flex-col items-center py-3 relative group">
      <div className="h-8 w-px bg-border relative">
        <svg className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-4 overflow-visible">
          <line
            x1="8" y1="0" x2="8" y2="32"
            className="stroke-primary/30 stroke-[2] transition-colors"
          />
          <line
            x1="8" y1="0" x2="8" y2="32"
            className="stroke-primary stroke-[2] animate-flow opacity-40 group-hover:opacity-100 transition-opacity"
            style={{ strokeDasharray: "4 4" }}
          />
        </svg>
        <ArrowDown className="absolute -bottom-2 -left-2 h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
      </div>
    </div>
  )
}
