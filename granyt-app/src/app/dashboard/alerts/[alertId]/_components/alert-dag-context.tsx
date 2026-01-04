"use client"

import { MapPin, Workflow, ExternalLink } from "lucide-react"
import Link from "next/link"
import { AlertData } from "./types"

interface AlertPipelineContextProps {
  alert: AlertData
  basePath?: string
}

export function AlertPipelineContext({ alert, basePath = "/dashboard" }: AlertPipelineContextProps) {
  return (
    <div className="bg-muted/50 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">DAG</p>
            <Link 
              href={`${basePath}/dags/${encodeURIComponent(alert.srcDagId)}`}
              className="text-lg font-semibold text-primary hover:underline flex items-center gap-1.5 group"
            >
              {alert.srcDagId}
              <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-border mx-2" />
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Run</p>
        <Link
          href={`${basePath}/dags/${encodeURIComponent(alert.srcDagId)}/runs/${encodeURIComponent(alert.dagRunId)}`}
          className="flex items-center gap-1.5 group hover:text-primary transition-colors"
        >
          <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <p className="text-lg font-semibold group-hover:underline">{alert.srcRunId}</p>
          <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  )
}
