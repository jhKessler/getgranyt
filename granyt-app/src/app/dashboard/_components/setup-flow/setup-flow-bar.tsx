"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { X, Check, Copy, Key, Bell, Bug, Download } from "lucide-react"
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
import { SetupMilestone, STORAGE_KEY } from "./types"
import { FlowNode, FlowNodeLarge } from "./flow-node"
import { FlowConnector, FlowConnectorLarge } from "./flow-connector"
import { MilestoneSection } from "./milestone-section"

export function SetupFlowBar() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dismissedMilestoneCount, setDismissedMilestoneCount] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null)

  const { data: setupStatus, refetch } = trpc.dashboard.getSetupStatus.useQuery(
    {},
    { refetchOnWindowFocus: false }
  )

  const [pollingStartTime] = useState(() => Date.now())
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    if (!setupStatus || setupStatus.hasDagRuns || !isPolling) return

    const elapsed = Date.now() - pollingStartTime

    if (elapsed >= 600000) {
      setIsPolling(false)
      return
    }

    const interval = elapsed >= 60000 ? 30000 : 5000
    const timer = setTimeout(() => refetch(), interval)
    return () => clearTimeout(timer)
  }, [setupStatus, isPolling, pollingStartTime, refetch])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    setDismissedMilestoneCount(stored ? parseInt(stored, 10) : 0)
  }, [])

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

  if (dismissedMilestoneCount === null || !setupStatus) return null
  if (dismissedMilestoneCount >= completedCount && completedCount > 0) return null
  if (isAllComplete) return null

  return (
    <>
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
        <div className="flex items-center gap-1">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="flex items-center">
              <FlowNode
                milestone={milestone}
                isActive={index === currentMilestoneIndex}
              />
              {index < milestones.length - 1 && (
                <FlowConnector
                  isComplete={milestone.isComplete}
                  isActive={index === currentMilestoneIndex}
                />
              )}
            </div>
          ))}
        </div>

        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {completedCount}/4 complete
        </span>

        <button
          onClick={handleDismiss}
          className="ml-1 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Getting Started</DialogTitle>
            <DialogDescription>
              Complete these steps to get the most out of Granyt
            </DialogDescription>
          </DialogHeader>

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

          <div className="space-y-2 border-t pt-4">
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
