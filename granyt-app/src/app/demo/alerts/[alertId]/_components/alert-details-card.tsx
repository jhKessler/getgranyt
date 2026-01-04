"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertMetadata } from "./types"
import { Plus, Minus, RefreshCw } from "lucide-react"

interface AlertDetailsCardProps {
  alertType: string
  metadata?: AlertMetadata
}

export function AlertDetailsCard({ alertType, metadata }: AlertDetailsCardProps) {
  if (!metadata) {
    return null
  }

  if (alertType === "ROW_COUNT_DROP") {
    return <RowCountDropDetails metadata={metadata} />
  }

  if (alertType === "NULL_OCCURRENCE") {
    return <NullOccurrenceDetails metadata={metadata} />
  }

  if (alertType === "SCHEMA_CHANGE") {
    return <SchemaChangeDetails metadata={metadata} />
  }

  return null
}

function RowCountDropDetails({ metadata }: { metadata: AlertMetadata }) {
  const confidenceBadgeColor = metadata.confidence === "high" 
    ? "bg-green-500/10 text-green-500 border-green-500/20"
    : metadata.confidence === "medium"
      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      : "bg-orange-500/10 text-orange-500 border-orange-500/20"
  
  const baselineTypeLabel = metadata.baselineType === "cohort" 
    ? "Same day-of-week" 
    : "Overall average"
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Alert Details</CardTitle>
          {metadata.confidence && (
            <Badge variant="outline" className={confidenceBadgeColor}>
              {metadata.confidence} confidence
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Rows</p>
            <p className="text-2xl font-bold text-red-500">
              {metadata.current?.toLocaleString() ?? 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Baseline (expected)</p>
            <p className="text-2xl font-bold">
              {metadata.baseline?.toLocaleString() ?? "?"}
            </p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <MetricRow 
            label="Drop Percentage" 
            value={metadata.dropPercentage !== undefined 
              ? `${Math.round(metadata.dropPercentage)}%` 
              : "?"}
            valueClassName="text-red-500"
          />
          <MetricRow 
            label="Baseline Type" 
            value={baselineTypeLabel}
            hint={metadata.baselineType === "cohort" && metadata.cohortSize 
              ? `(${metadata.cohortSize} runs in cohort)` 
              : undefined}
          />
          <MetricRow 
            label="Runs Analyzed" 
            value={String(metadata.runsAnalyzed ?? "?")} 
          />
          <MetricRow 
            label="Sensitivity Level" 
            value={`${metadata.threshold ?? "MEDIUM"}${metadata.customThreshold ? ` (${metadata.customThreshold}%)` : ""}`} 
          />
        </div>
      </CardContent>
    </Card>
  )
}

function NullOccurrenceDetails({ metadata }: { metadata: AlertMetadata }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Affected Columns</p>
            <p className="text-2xl font-bold text-amber-500">
              {metadata.columnCount ?? metadata.affectedColumns?.length ?? 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Null Values</p>
            <p className="text-2xl font-bold">
              {metadata.totalNullCount?.toLocaleString() ?? "?"}
            </p>
          </div>
        </div>
        
        <Separator />
        
        {metadata.affectedColumns && metadata.affectedColumns.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Columns with new nulls:</p>
            <div className="space-y-1">
              {metadata.affectedColumns.map((col) => (
                <div key={col.name} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                  <span className="font-mono">{col.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{col.dtype}</Badge>
                    <span className="text-amber-500">{col.nullCount} nulls</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Separator />
        
        <div className="space-y-2">
          <MetricRow 
            label="Historical Occurrences Analyzed" 
            value={String(metadata.historicalOccurrencesAnalyzed ?? "?")} 
          />
          <MetricRow 
            label="Sensitivity Level" 
            value={metadata.sensitivity ?? "MEDIUM"} 
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SchemaChangeDetails({ metadata }: { metadata: AlertMetadata }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schema Change Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Added</p>
            <p className="text-2xl font-bold text-green-500">
              {metadata.summary?.addedCount ?? 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Removed</p>
            <p className="text-2xl font-bold text-red-500">
              {metadata.summary?.removedCount ?? 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Type Changed</p>
            <p className="text-2xl font-bold text-amber-500">
              {metadata.summary?.typeChangedCount ?? 0}
            </p>
          </div>
        </div>
        
        <Separator />

        {metadata.addedColumns && metadata.addedColumns.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-500" />
              Added Columns
            </p>
            <div className="space-y-1">
              {metadata.addedColumns.map((col) => (
                <div key={col.name} className="flex justify-between items-center text-sm p-2 bg-green-500/10 rounded">
                  <span className="font-mono">{col.name}</span>
                  <Badge variant="outline" className="text-green-600">{col.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {metadata.removedColumns && metadata.removedColumns.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Minus className="h-4 w-4 text-red-500" />
              Removed Columns
            </p>
            <div className="space-y-1">
              {metadata.removedColumns.map((col) => (
                <div key={col.name} className="flex justify-between items-center text-sm p-2 bg-red-500/10 rounded">
                  <span className="font-mono">{col.name}</span>
                  <Badge variant="outline" className="text-red-600">{col.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {metadata.typeChangedColumns && metadata.typeChangedColumns.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-amber-500" />
              Type Changed Columns
            </p>
            <div className="space-y-1">
              {metadata.typeChangedColumns.map((col) => (
                <div key={col.name} className="flex justify-between items-center text-sm p-2 bg-amber-500/10 rounded">
                  <span className="font-mono">{col.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-muted-foreground">{col.previousType}</Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="outline" className="text-amber-600">{col.currentType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Separator />
        
        <div className="space-y-2">
          <MetricRow 
            label="Previous Column Count" 
            value={String(metadata.previousColumnCount ?? "?")} 
          />
          <MetricRow 
            label="Current Column Count" 
            value={String(metadata.currentColumnCount ?? "?")} 
          />
          <MetricRow 
            label="Sensitivity Level" 
            value={metadata.sensitivity ?? "MEDIUM"} 
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricRowProps {
  label: string
  value: string
  valueClassName?: string
  hint?: string
}

function MetricRow({ label, value, valueClassName, hint }: MetricRowProps) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClassName ?? ""}`}>
        {value}
        {hint && <span className="text-xs text-muted-foreground ml-1">{hint}</span>}
      </span>
    </div>
  )
}
