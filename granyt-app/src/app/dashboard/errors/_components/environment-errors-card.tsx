"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ErrorListItem } from "./errors-list"
import { CheckCircle, ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import Link from "next/link"

interface ErrorItem {
  id: string
  exceptionType: string
  message: string
  status: string
  occurrenceCount: number
  dagCount: number
  firstSeenAt: Date | string
  lastSeenAt: Date | string
}

interface EnvironmentErrorsCardProps {
  environmentType: "default" | "non-default"
  environmentName?: string // The actual name of the default environment (e.g., "production", "main")
  errors: ErrorItem[]
  maxDisplay?: number
}



function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <CheckCircle className="h-10 w-10 mb-3 text-green-500" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function EnvironmentErrorsCard({ 
  environmentType, 
  environmentName, 
  errors, 
  maxDisplay = 5 
}: EnvironmentErrorsCardProps) {
  const [isOpen, setIsOpen] = useState(true)
  
  const isDefault = environmentType === "default"
  // Use the actual environment name if provided, otherwise fall back to type label
  const displayName = isDefault && environmentName 
    ? environmentName.charAt(0).toUpperCase() + environmentName.slice(1)
    : isDefault ? "Default" : "Other"
  const title = `${displayName} Errors`
  const emptyMessage = isDefault 
    ? `All ${environmentName || "default"} DAGs are running smoothly` 
    : "All other DAGs are running smoothly"
  const viewAllHref = `/dashboard/errors/${environmentType}`
  
  const hasErrors = errors.length > 0
  const displayedErrors = errors.slice(0, maxDisplay)
  const remainingCount = Math.max(0, errors.length - maxDisplay)

  if (!hasErrors) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                0
              </Badge>
            </div>
          </div>
          <CardDescription>
            {isDefault ? `Critical errors in ${environmentName || "default environment"}` : "Errors in non-default environments"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState message={emptyMessage} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <Badge variant={isDefault ? "destructive" : "secondary"} className="text-xs">
                    {errors.length}
                  </Badge>
                </div>
              </Button>
            </CollapsibleTrigger>
            <Button variant="outline" size="sm" asChild>
              <Link href={viewAllHref}>
                View All
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <CardDescription>
            {isDefault 
              ? `${errors.length} critical error${errors.length !== 1 ? "s" : ""} in ${environmentName || "default environment"} requiring attention`
              : `${errors.length} error${errors.length !== 1 ? "s" : ""} in non-default environments`
            }
          </CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {displayedErrors.map((error) => (
                <ErrorListItem key={error.id} error={error} />
              ))}
            </div>
            {remainingCount > 0 && (
              <div className="mt-4 text-center">
                <Button variant="link" asChild>
                  <Link href={viewAllHref}>
                    View {remainingCount} more error{remainingCount !== 1 ? "s" : ""}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
