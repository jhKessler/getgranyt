"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Key, ArrowRight, Check, Copy } from "lucide-react"
import { AirflowIcon, DagsterIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

export type OrchestratorType = "airflow" | "dagster"

interface ApiKeyStepProps {
  apiKey: string | null
  selectedType: OrchestratorType
  keyName: string
  onTypeChange: (type: OrchestratorType) => void
  onKeyNameChange: (name: string) => void
  onGenerateKey: () => void
  onCopyApiKey: () => void
  onFinish: () => void
  copied: boolean
  isGenerating: boolean
}

export function ApiKeyStep({
  apiKey,
  selectedType,
  keyName,
  onTypeChange,
  onKeyNameChange,
  onGenerateKey,
  onCopyApiKey,
  onFinish,
  copied,
  isGenerating,
}: ApiKeyStepProps) {
  if (apiKey) {
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
          <InstallationInstructions apiKey={apiKey} selectedType={selectedType} />
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={onFinish}>
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Key className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Create API Key</CardTitle>
        <CardDescription>
          Generate an API key to connect your orchestrator
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Orchestrator Type</Label>
          <div className="grid grid-cols-2 gap-4">
            <OrchestratorOption
              type="airflow"
              selected={selectedType === "airflow"}
              onClick={() => onTypeChange("airflow")}
            />
            <OrchestratorOption
              type="dagster"
              selected={selectedType === "dagster"}
              onClick={() => onTypeChange("dagster")}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="keyName">Key Name</Label>
          <Input
            id="keyName"
            placeholder={`e.g., Production ${selectedType === "airflow" ? "Airflow" : "Dagster"}`}
            value={keyName}
            onChange={(e) => onKeyNameChange(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onGenerateKey}
          disabled={!keyName.trim() || isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate API Key"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function OrchestratorOption({
  type,
  selected,
  onClick,
}: {
  type: OrchestratorType
  selected: boolean
  onClick: () => void
}) {
  const Icon = type === "airflow" ? AirflowIcon : DagsterIcon
  const name = type === "airflow" ? "Airflow" : "Dagster"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-primary/50"
      )}
    >
      <Icon className="h-10 w-10" />
      <span className="font-medium">{name}</span>
    </button>
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
  apiKey, 
  selectedType 
}: { 
  apiKey: string | null
  selectedType: OrchestratorType 
}) {
  const connectorName = selectedType === "airflow" ? "Airflow" : "Dagster"
  
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
            The SDK automatically captures lineage and errors from your {connectorName} DAGs.
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
