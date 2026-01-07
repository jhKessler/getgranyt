"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Key, ArrowRight, Check, Copy, Loader2, Info, Terminal, ExternalLink } from "lucide-react"
import { InstallationInstructions } from "@/components/shared"
import { getDocsLink } from "@/lib/utils"

interface ApiKeyStepProps {
  apiKey: string | null
  onCopyApiKey: () => void
  onFinish: () => void
  copied: boolean
  isGenerating: boolean
}

export function ApiKeyStep({
  apiKey,
  onCopyApiKey,
  onFinish,
  copied,
  isGenerating,
}: ApiKeyStepProps) {
  if (isGenerating || !apiKey) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating your API key...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <Key className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <CardTitle className="text-2xl">Your API Key</CardTitle>
        <CardDescription>
          This key connects the Granyt SDK to your account.{" "}
          <span className="font-medium text-amber-600 dark:text-amber-400">Save it securely — it won&apos;t be shown again.</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ApiKeyDisplay apiKey={apiKey} onCopy={onCopyApiKey} copied={copied} />
        
        {/* Important Airflow Instructions */}
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700 dark:text-blue-400">Add to your Airflow environment</AlertTitle>
          <AlertDescription className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">
              For the Granyt SDK to capture metrics, errors, and lineage from your DAGs, you need to add this API key 
              to your Airflow environment variables:
            </p>
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Terminal className="h-3 w-3" />
                Environment Variables
              </div>
              <code className="text-xs font-mono block whitespace-pre-wrap break-all">
{`GRANYT_API_KEY="${apiKey}"
GRANYT_ENDPOINT="${typeof window !== 'undefined' ? window.location.origin : 'https://your-granyt-instance.com'}"`}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Add these to your <code className="bg-muted px-1 rounded">docker-compose.yml</code>, 
              <code className="bg-muted px-1 rounded">airflow.cfg</code>, or cloud provider&apos;s environment configuration.
            </p>
          </AlertDescription>
        </Alert>

        <InstallationInstructions apiKey={apiKey} />
        
        <div className="text-center">
          <a
            href={getDocsLink("/")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View full SDK documentation
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onFinish}>
          Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function ApiKeyDisplay({ 
  apiKey, 
  onCopy, 
  copied 
}: { 
  apiKey: string | null
  onCopy: () => void
  copied: boolean 
}) {
  return (
    <div className="space-y-2">
      <Label>API Key</Label>
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 p-3 bg-muted rounded-lg overflow-hidden">
          <code className="text-xs font-mono break-all block">
            {apiKey}
          </code>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={onCopy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
