"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save } from "lucide-react"

export interface SmtpConfigFormProps {
  config: Record<string, unknown> | null
  onSave: (config: Record<string, unknown>) => void
  isSaving: boolean
  compact?: boolean
}

export function SmtpConfigForm({ config, onSave, isSaving, compact = false }: SmtpConfigFormProps) {
  const [host, setHost] = useState((config?.host as string) ?? "")
  const [port, setPort] = useState((config?.port as number)?.toString() ?? "587")
  const [user, setUser] = useState((config?.user as string) ?? "")
  const [password, setPassword] = useState("")
  const [secure, setSecure] = useState((config?.secure as boolean) ?? true)
  const [fromEmail, setFromEmail] = useState((config?.fromEmail as string) ?? "")
  const [fromName, setFromName] = useState((config?.fromName as string) ?? "")

  const handleSave = () => {
    onSave({
      host,
      port: parseInt(port, 10),
      user,
      password: password || config?.password,
      secure,
      fromEmail,
      fromName,
    })
  }

  const isValid = host && port && user && fromEmail && (password || config?.password)

  return (
    <div className="space-y-4">
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-2">
          <Label htmlFor="smtp-host">SMTP Host</Label>
          <Input
            id="smtp-host"
            placeholder="smtp.example.com"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp-port">Port</Label>
          <Input
            id="smtp-port"
            type="number"
            placeholder="587"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp-user">Username</Label>
          <Input
            id="smtp-user"
            placeholder="user@example.com"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp-password">Password</Label>
          <Input
            id="smtp-password"
            type="password"
            placeholder={config?.password ? "••••••••" : "Enter password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp-from-email">From Email</Label>
          <Input
            id="smtp-from-email"
            type="email"
            placeholder="notifications@example.com"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp-from-name">From Name (optional)</Label>
          <Input
            id="smtp-from-name"
            placeholder="Granyt Notifications"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="smtp-secure" checked={secure} onCheckedChange={setSecure} />
        <Label htmlFor="smtp-secure">Use TLS/SSL</Label>
      </div>
      <Button onClick={handleSave} disabled={isSaving || !isValid} className="w-full sm:w-auto">
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save SMTP Settings
      </Button>
    </div>
  )
}

export interface ResendConfigFormProps {
  config: Record<string, unknown> | null
  onSave: (config: Record<string, unknown>) => void
  isSaving: boolean
  compact?: boolean
}

export function ResendConfigForm({ config, onSave, isSaving, compact = false }: ResendConfigFormProps) {
  const [apiKey, setApiKey] = useState("")
  const [fromEmail, setFromEmail] = useState((config?.fromEmail as string) ?? "")
  const [fromName, setFromName] = useState((config?.fromName as string) ?? "")

  const handleSave = () => {
    onSave({
      apiKey: apiKey || config?.apiKey,
      fromEmail,
      fromName,
    })
  }

  const isValid = fromEmail && (apiKey || config?.apiKey)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resend-api-key">API Key</Label>
        <Input
          id="resend-api-key"
          type="password"
          placeholder={config?.apiKey ? "re_••••••••" : "re_xxxxxxxx"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Get your API key from{" "}
          <a
            href="https://resend.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            resend.com/api-keys
          </a>
        </p>
      </div>
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-2">
          <Label htmlFor="resend-from-email">From Email</Label>
          <Input
            id="resend-from-email"
            type="email"
            placeholder="notifications@yourdomain.com"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="resend-from-name">From Name (optional)</Label>
          <Input
            id="resend-from-name"
            placeholder="Granyt Notifications"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={handleSave} disabled={isSaving || !isValid} className="w-full sm:w-auto">
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Resend Settings
      </Button>
    </div>
  )
}
