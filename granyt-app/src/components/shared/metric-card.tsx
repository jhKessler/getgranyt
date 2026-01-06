"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: number | string
  description?: string
  tooltip?: string
  icon: React.ComponentType<{ className?: string }>
  isLoading: boolean
  href?: string
  variant?: "default" | "destructive"
}

export function MetricCard({ 
  title, 
  value, 
  description,
  tooltip,
  icon: Icon, 
  isLoading,
  href,
  variant = "default",
}: MetricCardProps) {
  const isDestructive = variant === "destructive"
  
  const cardContent = (
    <Card className={cn(
      href && "group cursor-pointer transition-colors hover:bg-muted/50"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <CardTitle className="text-xs sm:text-sm font-semibold truncate">{title}</CardTitle>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px]">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <Icon className={cn(
          "h-4 w-4 shrink-0 hidden sm:block",
          isDestructive ? "text-destructive" : "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        {isLoading ? (
          <Skeleton className="h-5 sm:h-8 w-14 sm:w-20" />
        ) : (
          <div className={cn(
            "text-base sm:text-2xl font-bold truncate",
            isDestructive && "text-destructive",
            href && "group-hover:underline decoration-2 underline-offset-4"
          )}>{value}</div>
        )}
        {description && (
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{description}</p>
        )}
      </CardContent>
    </Card>
  )
  
  if (href) {
    return <Link href={href}>{cardContent}</Link>
  }
  
  return cardContent
}
