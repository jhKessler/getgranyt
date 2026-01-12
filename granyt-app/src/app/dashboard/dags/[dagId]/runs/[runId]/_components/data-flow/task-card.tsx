"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getRunStatusBadgeStyle, getRunStatusDotColor } from "@/lib/status-colors"
import {
  ChevronDown,
  ChevronRight,
  Columns,
  HardDrive,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Cog
} from "lucide-react"
import { TaskGroup } from "./types"
import {
  formatBytes,
  getShortTaskId,
  getMemoryBytes,
  aggregateColumns,
  aggregateCustomMetrics
} from "./utils"

interface TaskCardProps {
  group: TaskGroup
  isExpanded: boolean
  onToggle: () => void
}

export function TaskCard({ group, isExpanded, onToggle }: TaskCardProps) {
  const aggregatedColumns = useMemo(() => aggregateColumns(group.captures), [group.captures])
  const aggregatedMetrics = useMemo(() => aggregateCustomMetrics(group.captures), [group.captures])

  const totalNulls = aggregatedColumns.reduce((sum, col) => sum + col.totalNulls, 0)
  const totalEmpty = aggregatedColumns.reduce((sum, col) => sum + col.totalEmpty, 0)
  const hasIssues = totalNulls > 0 || totalEmpty > 0
  const hasCustomMetrics = Object.keys(aggregatedMetrics).length > 0
  const totalMemory = group.captures.reduce((sum, c) => sum + (getMemoryBytes(c.metrics) || 0), 0)

  const statusBadgeStyle = getRunStatusBadgeStyle(group.status)
  const statusDotColor = getRunStatusDotColor(group.status)

  return (
    <div className={cn(
      "border rounded-lg bg-card transition-all duration-200 hover:border-primary/50",
      statusBadgeStyle && `border-l-4 ${statusBadgeStyle.split(' ').find(c => c.startsWith('border-'))}`
    )}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full p-4 h-auto justify-start hover:bg-muted/50"
          >
            <div className="flex items-start gap-4 w-full">
              <div className="mt-0.5">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", statusDotColor)} />
                  <Cog className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getShortTaskId(group.taskId)}</span>
                  {group.status && (
                    <Badge variant="outline" className={cn("text-xs", statusBadgeStyle)}>
                      {group.status}
                    </Badge>
                  )}
                  {hasIssues && (
                    <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                  )}
                  {hasCustomMetrics && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Has custom metrics</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-bold text-primary">
                      {group.totalRows.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-xs">rows</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Columns className="h-3.5 w-3.5" />
                    <span>{aggregatedColumns.length} columns</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>{formatBytes(totalMemory)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Estimated memory usage</p>
                    </TooltipContent>
                  </Tooltip>
                  {hasIssues && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-yellow-600 cursor-help">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{totalNulls.toLocaleString()} nulls, {totalEmpty.toLocaleString()} empty</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Data quality issues detected</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {hasCustomMetrics && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(aggregatedMetrics).slice(0, 4).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs font-normal">
                        <BarChart3 className="h-3 w-3 mr-1 text-blue-500" />
                        {key}: {typeof value === 'number' && !Number.isInteger(value)
                          ? value.toFixed(2)
                          : value.toLocaleString()}
                      </Badge>
                    ))}
                    {Object.keys(aggregatedMetrics).length > 4 && (
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        +{Object.keys(aggregatedMetrics).length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t space-y-4">
            {hasCustomMetrics && (
              <div className="pt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Custom Metrics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(aggregatedMetrics).map(([key, value]) => (
                    <div key={key} className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground truncate" title={key}>
                        {key}
                      </div>
                      <div className="text-lg font-semibold text-primary">
                        {typeof value === 'number' && !Number.isInteger(value)
                          ? value.toFixed(4)
                          : value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={hasCustomMetrics ? "" : "pt-4"}>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Columns className="h-4 w-4 text-muted-foreground" />
                Column Details
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium">Column</th>
                      <th className="text-left py-2 pr-4 font-medium">Type</th>
                      <th className="text-right py-2 pr-4 font-medium">
                        <div className="flex items-center justify-end gap-1">
                          Nulls
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Count of NULL/None values</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </th>
                      <th className="text-right py-2 font-medium">
                        <div className="flex items-center justify-end gap-1">
                          Empty Strings
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Count of empty string values</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedColumns.map((col) => (
                      <tr key={col.name} className="border-b border-muted/50 last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">{col.name}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="text-xs font-mono">
                            {col.dtype}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <span className={cn(col.totalNulls > 0 && "text-yellow-600 font-medium")}>
                            {col.totalNulls.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <span className={cn(col.totalEmpty > 0 && "text-yellow-600 font-medium")}>
                            {col.totalEmpty.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
