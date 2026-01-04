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
import { Key, ArrowRight, Check, Copy, Loader2 } from "lucide-react"

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
          Save this key securely. It won&apos;t be shown again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ApiKeyDisplay apiKey={apiKey} onCopy={onCopyApiKey} copied={copied} />
        <InstallationInstructions apiKey={apiKey} />
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

function InstallationInstructions({ 
  apiKey
}: { 
  apiKey: string | null
}) {
  return (
    <div className="space-y-4">
      <Label>Installation Instructions</Label>
      <div className="space-y-3 text-sm">
        <InstallStep
          step={1}
          title="Install the Granyt SDK:"
          code="pip install granyt-sdk"
        />
        <InstallStep
          step={2}
          title="Set environment variables:"
          code={`export GRANYT_ENDPOINT="https://your-granyt-instance.com"
export GRANYT_API_KEY="${apiKey}"`}
          multiline
        />
        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium">3. That&apos;s it!</p>
          <p className="text-muted-foreground mt-1">
            The SDK automatically captures lineage and errors from your DAGs.
          </p>
        </div>
      </div>
    </div>
  )
}

function InstallStep({ 
  step, 
  title, 
  code, 
  multiline = false 
}: { 
  step: number
  title: string
  code: string
  multiline?: boolean 
}) {
  return (
    <div className="p-4 bg-muted rounded-lg space-y-3">
      <p className="font-medium">{step}. {title}</p>
      <div className={multiline ? "p-2 bg-background rounded overflow-x-auto" : ""}>
        <code className={multiline 
          ? "text-xs whitespace-pre block"
          : "block p-2 bg-background rounded text-xs"
        }>
          {code}
        </code>
      </div>
    </div>
  )
}
