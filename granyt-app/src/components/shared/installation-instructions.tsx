"use client"

import { Label } from "@/components/ui/label"
import { env } from "@/env"

interface InstallationInstructionsProps {
  apiKey: string | null
}

export function InstallationInstructions({ 
  apiKey
}: InstallationInstructionsProps) {
  const endpoint = typeof window !== 'undefined' 
    ? window.location.origin 
    : (env.NEXT_PUBLIC_APP_URL ?? "https://your-granyt-instance.com")

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
          code={`export GRANYT_ENDPOINT="${endpoint}"
export GRANYT_API_KEY="${apiKey ?? 'YOUR_API_KEY'}"`}
          multiline
        />
        <div className="p-4 bg-muted rounded-lg border border-border/50">
          <p className="font-medium text-foreground">3. That&apos;s it!</p>
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
    <div className="p-4 bg-muted rounded-lg space-y-3 border border-border/50">
      <p className="font-medium text-foreground">{step}. {title}</p>
      <div className={multiline ? "p-2 bg-background rounded-md overflow-x-auto border border-border/50 shadow-sm" : ""}>
        <code className={multiline 
          ? "text-xs font-mono whitespace-pre block text-foreground"
          : "block p-2 bg-background rounded-md text-xs font-mono text-foreground border border-border/50 shadow-sm"
        }>
          {code}
        </code>
      </div>
    </div>
  )
}
