"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Mail, ArrowRight, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react"
import { getDocsLink } from "@/lib/utils"

interface EmailSetupStepProps {
  isEmailConfigured: boolean
  onSkip: () => void
  onContinue: () => void
}

export function EmailSetupStep({
  isEmailConfigured,
  onSkip,
  onContinue,
}: EmailSetupStepProps) {
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
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={onContinue}>
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
                Without email notifications, you won&apos;t receive alerts when data quality issues
                or pipeline errors occur.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-sm">Why set up email?</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Get instant alerts when data anomalies are detected</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Receive notifications about pipeline failures and errors</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Stay informed about schema changes in your datasets</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-3">
          <h4 className="font-medium text-sm">How to configure email:</h4>
          <p className="text-sm text-muted-foreground">
            Add the following environment variables to your deployment:
          </p>
          <div className="space-y-2">
            <div className="text-xs">
              <p className="font-medium">Option 1: SMTP</p>
              <code className="block p-2 bg-background rounded mt-1 text-muted-foreground">
                SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL
              </code>
            </div>
            <div className="text-xs">
              <p className="font-medium">Option 2: Resend</p>
              <code className="block p-2 bg-background rounded mt-1 text-muted-foreground">
                GRANYT_RESEND_API_KEY, RESEND_FROM_EMAIL
              </code>
            </div>
          </div>
          <a
            href={getDocsLink("/notifications")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
          >
            View full documentation
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button className="w-full" onClick={onContinue}>
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="ghost" className="w-full" onClick={onSkip}>
          Skip for now
        </Button>
      </CardFooter>
    </Card>
  )
}
