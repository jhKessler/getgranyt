"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink, Send, Loader2, SkipForward } from "lucide-react"
import { getDocsLink } from "@/lib/utils"
import { SmtpConfigForm, ResendConfigForm } from "@/components/shared"

interface EmailSetupStepProps {
  isEmailConfigured: boolean
  onBack?: () => void
  onSkip: () => void
  onContinue: () => void
  onSaveSmtp?: (config: Record<string, unknown>) => void
  onSaveResend?: (config: Record<string, unknown>) => void
  onSendTestEmail?: () => void
  isSavingConfig?: boolean
  isSendingTest?: boolean
  userEmail?: string
}

export function EmailSetupStep({
  isEmailConfigured,
  onBack,
  onSkip,
  onContinue,
  onSaveSmtp,
  onSaveResend,
  onSendTestEmail,
  isSavingConfig = false,
  isSendingTest = false,
  userEmail,
}: EmailSetupStepProps) {
  const [activeTab, setActiveTab] = useState("SMTP")

  if (isEmailConfigured) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Email Notifications Ready</CardTitle>
          <CardDescription>
            Your email settings are already configured via environment variables.
            You&apos;ll receive alerts and notifications automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  Email is configured
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Alert notifications will be sent to your email when issues are detected in your DAGs.
                </p>
              </div>
            </div>
          </div>
          
          {/* Send test email button */}
          {onSendTestEmail && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onSendTestEmail}
              disabled={isSendingTest}
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending test email...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send test email{userEmail ? ` to ${userEmail}` : ''}
                </>
              )}
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <Button className="flex-1" onClick={onContinue}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <CardTitle className="text-2xl">Set Up Email Notifications</CardTitle>
        <CardDescription>
          Get notified immediately when Granyt detects issues in your pipelines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Email not configured
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Configure an email provider below to receive alerts when issues are detected.
              </p>
            </div>
          </div>
        </div>

        {/* Email Configuration Forms */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="SMTP" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                SMTP
              </TabsTrigger>
              <TabsTrigger value="RESEND" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Resend
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="SMTP" className="mt-4">
              <SmtpConfigForm
                config={null}
                onSave={(config) => onSaveSmtp?.(config)}
                isSaving={isSavingConfig}
                compact
              />
            </TabsContent>
            
            <TabsContent value="RESEND" className="mt-4">
              <ResendConfigForm
                config={null}
                onSave={(config) => onSaveResend?.(config)}
                isSaving={isSavingConfig}
                compact
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Environment Variables Info */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <p className="text-xs font-medium">Or configure via environment variables:</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><span className="font-medium">SMTP:</span> SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL</p>
            <p><span className="font-medium">Resend:</span> GRANYT_RESEND_API_KEY, RESEND_FROM_EMAIL</p>
          </div>
          <a
            href={getDocsLink("/notifications")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View documentation
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <Button variant="outline" className="flex-1" onClick={onSkip}>
          <SkipForward className="mr-2 h-4 w-4" />
          Skip
        </Button>
        <Button 
          className="flex-1" 
          onClick={onContinue}
          disabled={!isEmailConfigured}
          title={!isEmailConfigured ? "Configure email above to continue" : undefined}
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
