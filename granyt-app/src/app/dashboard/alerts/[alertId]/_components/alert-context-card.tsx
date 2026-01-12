"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, MapPin } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { AlertData } from "./types"

interface AlertContextCardProps {
  alert: AlertData
  basePath?: string
}

export function AlertContextCard({ alert, basePath = "/dashboard" }: AlertContextCardProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <ContextRow label="DAG">
            <Button 
              variant="link" 
              className="h-auto p-0"
              onClick={() => router.push(`${basePath}/dags/${encodeURIComponent(alert.srcDagId)}`)}
            >
              {alert.srcDagId}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </ContextRow>
          
          {alert.captureId && (
            <ContextRow label="Capture Point">
              <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                {alert.captureId}
              </span>
            </ContextRow>
          )}
          
          <div className="bg-muted/50 border border-border rounded-lg p-3 my-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <MapPin className="h-4 w-4" />
              <span>Run (source of alert)</span>
            </div>
            <Button 
              variant="link" 
              className="h-auto p-0"
              onClick={() => router.push(`${basePath}/dags/${encodeURIComponent(alert.srcDagId)}/runs/${encodeURIComponent(alert.dagRunId)}`)}
            >
              <Badge variant="secondary" className="font-semibold text-sm cursor-pointer hover:bg-secondary/80">
                {alert.srcRunId}
              </Badge>
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
          
          <ContextRow label="Triggered At">
            <span className="font-medium">
              {format(new Date(alert.createdAt), "MMM d, yyyy HH:mm:ss")}
            </span>
          </ContextRow>
          
          {alert.acknowledgedAt && (
            <ContextRow label="Acknowledged At">
              <span className="font-medium">
                {format(new Date(alert.acknowledgedAt), "MMM d, yyyy HH:mm:ss")}
              </span>
            </ContextRow>
          )}
          
          {alert.dismissedAt && (
            <ContextRow label="Dismissed At">
              <span className="font-medium">
                {format(new Date(alert.dismissedAt), "MMM d, yyyy HH:mm:ss")}
              </span>
            </ContextRow>
          )}
        </div>
        
        <Separator />
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => router.push(`${basePath}/dags/${encodeURIComponent(alert.srcDagId)}/runs/${encodeURIComponent(alert.dagRunId)}`)}
        >
          View Run Details
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}

interface ContextRowProps {
  label: string
  children: React.ReactNode
}

function ContextRow({ label, children }: ContextRowProps) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
