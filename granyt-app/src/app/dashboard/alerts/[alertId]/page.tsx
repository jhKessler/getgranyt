"use client"

import { use, useState } from "react"
import { trpc } from "@/lib/trpc"
import { useDocumentTitle } from "@/lib/use-document-title"
import { toast } from "sonner"
import {
  AlertDetailHeader,
  AlertPipelineContext,
  AlertStatusBanner,
  AlertActionButtons,
  ExpectedBehaviorDialog,
  AlertDetailsCard,
  AlertContextCard,
  UnderstandingAlertCard,
  AlertDetailLoading,
  AlertNotFound,
  AlertMetadata,
  SensitivityLevel,
  AlertData,
} from "./_components"

export default function AlertDetailPage({ 
  params 
}: { 
  params: Promise<{ alertId: string }> 
}) {
  const { alertId } = use(params)
  const utils = trpc.useUtils()
  
  const [showExpectedDialog, setShowExpectedDialog] = useState(false)
  
  useDocumentTitle("Alert Details")
  
  const { data: alert, isLoading } = trpc.alerts.getAlert.useQuery({ alertId })
  
  const dismissMutation = trpc.alerts.dismiss.useMutation({
    onSuccess: () => {
      toast.success("Alert dismissed")
      invalidateAlertQueries()
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to dismiss alert", { description: error.message })
    },
  })
  
  const setDagSensitivityMutation = trpc.alerts.setDagSensitivity.useMutation({
    onSuccess: () => {
      toast.success("Sensitivity updated and alert dismissed")
      invalidateAlertQueries()
      setShowExpectedDialog(false)
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to update sensitivity", { description: error.message })
    },
  })
  
  const reopenMutation = trpc.alerts.reopen.useMutation({
    onSuccess: () => {
      toast.success("Alert reopened")
      invalidateAlertQueries()
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to reopen alert", { description: error.message })
    },
  })

  const invalidateAlertQueries = () => {
    utils.alerts.getAlert.invalidate({ alertId })
    utils.alerts.getAlerts.invalidate()
    utils.alerts.getAlertsSummary.invalidate()
  }

  const handleExpectedBehavior = (sensitivity: SensitivityLevel, customThreshold?: number, enabled?: boolean) => {
    setDagSensitivityMutation.mutate({
      alertId,
      sensitivity,
      customThreshold,
      enabled,
    })
  }

  const isPending = dismissMutation.isPending || reopenMutation.isPending || setDagSensitivityMutation.isPending

  if (isLoading) {
    return <AlertDetailLoading />
  }

  if (!alert) {
    return <AlertNotFound />
  }

  const metadata = alert.metadata as AlertMetadata
  const isCritical = alert.severity === "critical"
  const isOpen = alert.status === "OPEN"
  const isAcknowledged = alert.status === "ACKNOWLEDGED"
  const isDismissed = alert.status === "DISMISSED" || alert.status === "AUTO_RESOLVED"

  return (
    <div className="space-y-6">
      <AlertDetailHeader alert={alert as AlertData} />

      <AlertStatusBanner
        alert={alert as AlertData}
        isOpen={isOpen}
        isCritical={isCritical}
        isAcknowledged={isAcknowledged}
        isDismissed={isDismissed}
        isPending={isPending}
        onReopen={() => reopenMutation.mutate({ alertId })}
      />

      <AlertPipelineContext alert={alert as AlertData} />

      <UnderstandingAlertCard alertType={alert.alertType} metadata={metadata} />


      {(isOpen || isAcknowledged) && (
        <AlertActionButtons
          isPending={isPending}
          onExpectedBehavior={() => setShowExpectedDialog(true)}
          onDismiss={() => dismissMutation.mutate({ alertId })}
          alertType={alert.alertType}
        />
      )}

      <ExpectedBehaviorDialog
        open={showExpectedDialog}
        onOpenChange={setShowExpectedDialog}
        alert={alert as AlertData}
        isPending={setDagSensitivityMutation.isPending}
        onSubmit={handleExpectedBehavior}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <AlertDetailsCard alertType={alert.alertType} metadata={metadata} />
        <AlertContextCard alert={alert as AlertData} />
      </div>

    </div>
  )
}
