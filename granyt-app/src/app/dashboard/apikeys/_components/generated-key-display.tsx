"use client"

import { Button } from "@/components/ui/button"
import { Key, Copy, Check } from "lucide-react"

interface GeneratedKeyDisplayProps {
  apiKey: string
  copied: boolean
  onCopy: () => void
  onDone: () => void
}

export function GeneratedKeyDisplay({ 
  apiKey, 
  copied, 
  onCopy, 
  onDone 
}: GeneratedKeyDisplayProps) {
  return (
    <div className="p-4 border border-green-500/20 bg-green-500/5 rounded-lg space-y-3">
      <div className="flex items-center gap-2 text-green-500">
        <Key className="h-4 w-4" />
        <span className="font-medium">New API Key Generated</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Copy this key now. It won&apos;t be shown again.
      </p>
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
      <Button variant="outline" className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}
