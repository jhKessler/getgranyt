"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { X, Check, Copy, ChevronDown, Key, Bell, Bug, Download } from "lucide-react"
import { cn, getDocsLink } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const STORAGE_KEY = "granyt-setup-flow-dismissed-milestone-count"

interface SetupMilestone {
  id: string
  label: string
  shortLabel: string
  description: string
  isComplete: boolean
}

export function SetupFlowBar() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dismissedMilestoneCount, setDismissedMilestoneCount] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null)

  const { data: setupStatus, refetch } = trpc.dashboard.getSetupStatus.useQuery(
    {},
    { refetchOnWindowFocus: false }
  )

  // Polling for first DAG run
  const [pollingStartTime] = useState(() => Date.now())
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    if (!setupStatus || setupStatus.hasDagRuns || !isPolling) return

    const elapsed = Date.now() - pollingStartTime
    
    // Stop polling after 10 minutes
    if (elapsed >= 600000) {
      setIsPolling(false)
      return
    }

    // 5s initially, 30s after 1 minute
    const interval = elapsed >= 60000 ? 30000 : 5000

    const timer = setTimeout(() => refetch(), interval)
    return () => clearTimeout(timer)
  }, [setupStatus, isPolling, pollingStartTime, refetch])

  // Load dismissed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    setDismissedMilestoneCount(stored ? parseInt(stored, 10) : 0)
  }, [])

  // Auto-expand the first incomplete milestone
  useEffect(() => {
    if (!setupStatus || expandedMilestone) return
    
    if (!setupStatus.hasDagRuns) {
      setExpandedMilestone("sdk")
    } else if (!setupStatus.hasNotificationChannel) {
      setExpandedMilestone("notifications")
    } else if (!setupStatus.hasErrors) {
      setExpandedMilestone("error")
    }
  }, [setupStatus, expandedMilestone])

  const milestones: SetupMilestone[] = useMemo(() => {
    if (!setupStatus) return []
    return [
      {
        id: "sdk",
        label: "Install SDK",
        shortLabel: "SDK",
        description: "Set up the Granyt SDK in your Airflow environment",
        isComplete: setupStatus.hasDagRuns,
      },
      {
        id: "dag-run",
        label: "First DAG Run",
        shortLabel: "DAG",
        description: "Your first DAG execution data has been captured",
        isComplete: setupStatus.hasDagRuns,
      },
      {
        id: "notifications",
        label: "Configure Notifications",
        shortLabel: "Notify",
        description: "Set up email or webhook notifications for alerts",
        isComplete: setupStatus.hasNotificationChannel,
      },
      {
        id: "error",
        label: "First Error Tracked",
        shortLabel: "Error",
        description: "Automatic error tracking is working",
        isComplete: setupStatus.hasErrors,
      },
    ]
  }, [setupStatus])

  const completedCount = milestones.filter((m) => m.isComplete).length
  const currentMilestoneIndex = milestones.findIndex((m) => !m.isComplete)
  const isAllComplete = completedCount === 4

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    localStorage.setItem(STORAGE_KEY, completedCount.toString())
    setDismissedMilestoneCount(completedCount)
  }, [completedCount])

  const handleCopyInstall = useCallback(async () => {
    await navigator.clipboard.writeText("pip install granyt-sdk")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const toggleMilestone = useCallback((id: string) => {
    setExpandedMilestone((prev) => (prev === id ? null : id))
  }, [])

  // Don't render until localStorage loaded
  if (dismissedMilestoneCount === null || !setupStatus) return null

  // Hide if dismissed at current count or all complete
  if (dismissedMilestoneCount >= completedCount && completedCount > 0) return null
  if (isAllComplete) return null

  return (
    <>
      {/* Floating Flow Bar */}
      <div
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-40",
          "flex items-center gap-3 px-4 py-3 rounded-full",
          "bg-background/95 backdrop-blur border shadow-lg",
          "cursor-pointer transition-all duration-200",
          "hover:scale-[1.02] hover:shadow-xl",
          "animate-in slide-in-from-bottom-4 fade-in duration-500"
        )}
      >
        {/* Flow Visualization */}
        <div className="flex items-center gap-1">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="flex items-center">
              {/* Node */}
              <FlowNode
                milestone={milestone}
                isActive={index === currentMilestoneIndex}
              />
              {/* Connector */}
              {index < milestones.length - 1 && (
                <FlowConnector
                  isComplete={milestone.isComplete}
                  isActive={index === currentMilestoneIndex}
                />
              )}
            </div>
          ))}
        </div>

        {/* Label */}
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {completedCount}/4 complete
        </span>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="ml-1 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Getting Started</DialogTitle>
            <DialogDescription>
              Complete these steps to get the most out of Granyt
            </DialogDescription>
          </DialogHeader>

          {/* Large Flow Visualization */}
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-0">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="flex items-center">
                  <FlowNodeLarge
                    milestone={milestone}
                    isActive={index === currentMilestoneIndex}
                  />
                  {index < milestones.length - 1 && (
                    <FlowConnectorLarge
                      isComplete={milestone.isComplete}
                      isActive={index === currentMilestoneIndex}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Listening indicator */}
          {!setupStatus.hasDagRuns && isPolling && (
            <div className="flex items-center gap-2 py-2">
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                Listening for your first DAG run...
              </span>
            </div>
          )}

          {/* Expandable Milestone Sections */}
          <div className="space-y-2 border-t pt-4">
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
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Key className="h-3.5 w-3.5" />
                    Get API Key
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link
                    href={getDocsLink("/")}
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
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
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsModalOpen(false)}
                >
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
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Bug className="h-3.5 w-3.5" />
                  Example Error DAG
                </Link>
              </div>
            </MilestoneSection>
          </div>
        </DialogContent>
      </Dialog>
    </>
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

// Small flow node for the floating bar
function FlowNode({
  milestone,
  isActive,
}: {
  milestone: SetupMilestone
  isActive: boolean
}) {
  return (
    <div className="relative group">
      <div
        className={cn(
          "h-3 w-3 rounded-full transition-all duration-300",
          milestone.isComplete
            ? "bg-emerald-500 scale-100"
            : isActive
              ? "bg-primary animate-pulse"
              : "bg-muted-foreground/30"
        )}
      />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {milestone.shortLabel}
        {milestone.isComplete && " ✓"}
      </div>
    </div>
  )
}

// Small connector for the floating bar
function FlowConnector({
  isComplete,
  isActive,
}: {
  isComplete: boolean
  isActive: boolean
}) {
  return (
    <div className="relative h-0.5 w-6 mx-0.5 overflow-hidden rounded-full bg-muted-foreground/20">
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-all duration-500",
          isComplete ? "w-full bg-emerald-500" : "w-0 bg-primary"
        )}
      />
      {isActive && !isComplete && (
        <div className="absolute inset-y-0 left-0 w-full">
          <div className="h-full w-2 bg-primary/50 animate-flow-pulse rounded-full" />
        </div>
      )}
    </div>
  )
}

// Large flow node for the modal
function FlowNodeLarge({
  milestone,
  isActive,
}: {
  milestone: SetupMilestone
  isActive: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300",
          milestone.isComplete
            ? "bg-emerald-500 text-white"
            : isActive
              ? "bg-primary text-primary-foreground animate-pulse"
              : "bg-muted text-muted-foreground"
        )}
      >
        {milestone.isComplete ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          milestone.isComplete
            ? "text-emerald-600 dark:text-emerald-400"
            : isActive
              ? "text-foreground"
              : "text-muted-foreground"
        )}
      >
        {milestone.shortLabel}
      </span>
    </div>
  )
}

// Large connector for the modal
function FlowConnectorLarge({
  isComplete,
  isActive,
}: {
  isComplete: boolean
  isActive: boolean
}) {
  return (
    <div className="relative h-0.5 w-12 mx-1 overflow-hidden rounded-full bg-muted-foreground/20 self-start mt-4">
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-all duration-700 ease-out",
          isComplete ? "w-full bg-emerald-500" : "w-0 bg-primary"
        )}
      />
      {isActive && !isComplete && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="h-full w-3 bg-primary/60 animate-flow-slide rounded-full" />
        </div>
      )}
    </div>
  )
}
