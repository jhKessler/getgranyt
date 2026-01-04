"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Settings2 } from "lucide-react"
import { isBinaryAlert } from "./types"

interface AlertActionButtonsProps {
  isPending: boolean
  onExpectedBehavior: () => void
  onDismiss: () => void
  alertType: string
}

export function AlertActionButtons({ 
  isPending, 
  onExpectedBehavior, 
  onDismiss,
  alertType
}: AlertActionButtonsProps) {
  const isBinary = isBinaryAlert(alertType)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Take Action</CardTitle>
        <CardDescription>
          Choose how to handle this alert
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <Button
            variant="outline"
            className="h-auto py-4 px-5 justify-start border-blue-500/30 hover:bg-blue-500/5 hover:border-blue-500/50"
            onClick={onExpectedBehavior}
            disabled={isPending}
          >
            <div className="flex items-start gap-4">
              <Settings2 className="h-6 w-6 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-base">This is Expected Behavior</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isBinary 
                    ? "Disable this alert type for this pipeline"
                    : "Adjust sensitivity so this doesn't trigger alerts in the future"
                  }
                </p>
                <Badge variant="outline" className="mt-2 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                  Changes pipeline settings
                </Badge>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 px-5 justify-start border-green-500/30 hover:bg-green-500/5 hover:border-green-500/50"
            onClick={onDismiss}
            disabled={isPending}
          >
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-base">Acknowledge & Resolve</p>
                <p className="text-sm text-muted-foreground mt-1">
                  I&apos;ve reviewed this - mark as handled
                </p>
                <Badge variant="outline" className="mt-2 text-xs bg-green-500/10 text-green-600 border-green-500/20">
                  No settings changed
                </Badge>
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
