"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Check, Copy, Key, Bell, Bug, Download, ChevronDown } from "lucide-react"
import { cn, getDocsLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export interface SetupStatus {
  hasDagRuns: boolean
  hasNotificationChannel: boolean
  hasErrors: boolean
}

interface GettingStartedChecklistProps {
  setupStatus: SetupStatus | undefined
  isLoading?: boolean
  onNavigate?: () => void
  compact?: boolean
}

interface SetupMilestone {
  id: string
  label: string
  description: string
  isComplete: boolean
}

export function GettingStartedChecklist({
  setupStatus,
  isLoading = false,
  onNavigate,
  compact = false,
}: GettingStartedChecklistProps) {
  const [copied, setCopied] = useState(false)
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null)

  const handleCopyInstall = useCallback(async () => {
    await navigator.clipboard.writeText("pip install granyt-sdk")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const toggleMilestone = useCallback((id: string) => {
    setExpandedMilestone((prev) => (prev === id ? null : id))
  }, [])

  if (isLoading || !setupStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Loading setup status...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const milestones: SetupMilestone[] = [
    {
      id: "sdk",
      label: "Install SDK",
      description: "Set up the Granyt SDK in your Airflow environment",
      isComplete: setupStatus.hasDagRuns,
    },
    {
      id: "dag-run",
      label: "First DAG Run",
      description: "Your first DAG execution data has been captured",
      isComplete: setupStatus.hasDagRuns,
    },
    {
      id: "notifications",
      label: "Configure Notifications",
      description: "Set up email or webhook notifications for alerts",
      isComplete: setupStatus.hasNotificationChannel,
    },
    {
      id: "error",
      label: "First Error Tracked",
      description: "Automatic error tracking is working",
      isComplete: setupStatus.hasErrors,
    },
  ]

  const completedCount = milestones.filter((m) => m.isComplete).length
  const isAllComplete = completedCount === milestones.length

  if (isAllComplete && compact) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Getting Started
              {isAllComplete && (
                <span className="text-sm font-normal text-emerald-600 dark:text-emerald-400">
                  ✓ All complete
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Complete these steps to get the most out of Granyt
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-medium">{completedCount}/{milestones.length}</span>
            <span>complete</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(completedCount / milestones.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Install SDK */}
        <MilestoneSection
          id="sdk"
          icon={Download}
          label="Install SDK"
          description="Set up the Granyt SDK in your Airflow environment"
          isComplete={setupStatus.hasDagRuns}
          isExpanded={expandedMilestone === "sdk"}
          onToggle={() => toggleMilestone("sdk")}
        >
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">
                pip install granyt-sdk
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInstall}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/settings"
                onClick={onNavigate}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Key className="h-3.5 w-3.5" />
                Get API Key
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href={getDocsLink("/")}
                onClick={onNavigate}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                target="_blank"
              >
                Installation Guide
              </Link>
            </div>
          </div>
        </MilestoneSection>

        {/* First DAG Run - non-expandable, just status */}
        <MilestoneSection
          id="dag-run"
          icon={Check}
          label="First DAG Run"
          description="Your first DAG execution data has been captured"
          isComplete={setupStatus.hasDagRuns}
          isExpanded={false}
          onToggle={() => {}}
          expandable={false}
        />

        {/* Configure Notifications */}
        <MilestoneSection
          id="notifications"
          icon={Bell}
          label="Configure Notifications"
          description="Set up email or webhook notifications for alerts"
          isComplete={setupStatus.hasNotificationChannel}
          isExpanded={expandedMilestone === "notifications"}
          onToggle={() => toggleMilestone("notifications")}
        >
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Get notified when alerts are triggered or errors occur in your DAGs.
            </p>
            <Link href="/dashboard/settings" onClick={onNavigate}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                Configure Notifications
              </Button>
            </Link>
          </div>
        </MilestoneSection>

        {/* First Error Tracked */}
        <MilestoneSection
          id="error"
          icon={Bug}
          label="First Error Tracked"
          description="Automatic error tracking is working"
          isComplete={setupStatus.hasErrors}
          isExpanded={expandedMilestone === "error"}
          onToggle={() => toggleMilestone("error")}
        >
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Test error tracking by running a DAG that intentionally fails.
            </p>
            <Link
              href={getDocsLink("/error-tracking/test-dag")}
              onClick={onNavigate}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              target="_blank"
            >
              <Bug className="h-3.5 w-3.5" />
              Example Error DAG
            </Link>
          </div>
        </MilestoneSection>
      </CardContent>
    </Card>
  )
}

// Expandable milestone section component
function MilestoneSection({
  icon: Icon,
  label,
  description,
  isComplete,
  isExpanded,
  onToggle,
  expandable = true,
  children,
}: {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  isComplete: boolean
  isExpanded: boolean
  onToggle: () => void
  expandable?: boolean
  children?: React.ReactNode
}) {
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
        {/* Status Icon */}
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

        {/* Label & Description */}
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

        {/* Expand Arrow */}
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
