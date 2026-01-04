"use client";

import { useState } from "react";
import Link from "next/link";
import { getDocsLink } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  Mail,
  Send,
  Webhook,
  Bell,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Loader2,
  TestTube,
  Save,
  Trash2,
  ExternalLink,
  Info,
} from "lucide-react";

interface ChannelStatus {
  type: "SMTP" | "RESEND" | "WEBHOOK";
  displayName: string;
  description: string;
  isConfigured: boolean;
  isEnabled: boolean;
  hasEnvConfig: boolean;
}

interface ChannelConfig {
  channelType: string;
  enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  hasEnvConfig: boolean;
  lastTestAt: Date | string | null;
  lastTestSuccess: boolean | null;
  lastTestError: string | null;
}

interface ChannelSettingsCardProps {
  channelStatuses: ChannelStatus[] | undefined;
  onToggleChannel: (channelType: string, enabled: boolean) => void;
  onSaveConfig: (channelType: string, enabled: boolean, config: Record<string, unknown> | null) => void;
  onTestConnection: (channelType: string) => void;
  onSendTest: (channelType: string, recipient: string) => void;
  onClearConfig: (channelType: string) => void;
  getChannelConfig: (channelType: string) => ChannelConfig | undefined;
  isTogglingChannel: boolean;
  isSavingConfig: boolean;
  isTestingConnection: boolean;
  isSendingTest: boolean;
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  SMTP: Mail,
  RESEND: Send,
  WEBHOOK: Webhook,
};

export function EmailSetupCard({
  channelStatuses,
  onToggleChannel,
  onSaveConfig,
  onTestConnection,
  onSendTest,
  onClearConfig,
  getChannelConfig,
  isTogglingChannel,
  isSavingConfig,
  isTestingConnection,
  isSendingTest,
}: ChannelSettingsCardProps) {
  const [activeTab, setActiveTab] = useState("SMTP");
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const emailChannels = channelStatuses?.filter(
    (c) => c.type === "SMTP" || c.type === "RESEND"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>Email Setup</CardTitle>
        </div>
        <CardDescription>
          Configure your email provider. Only one can be active at a time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            {emailChannels?.map((channel) => {
              const Icon = CHANNEL_ICONS[channel.type] ?? Mail;
              return (
                <TabsTrigger
                  key={channel.type}
                  value={channel.type}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {channel.displayName}
                  {channel.isConfigured && channel.isEnabled && (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {emailChannels?.map((channel) => (
            <TabsContent key={channel.type} value={channel.type} className="mt-4">
              <ChannelTab
                channel={channel}
                config={getChannelConfig(channel.type)}
                onToggle={(enabled) => onToggleChannel(channel.type, enabled)}
                onSave={(enabled, config) =>
                  onSaveConfig(channel.type, enabled, config)
                }
                onTest={() => onTestConnection(channel.type)}
                onSendTest={(recipient) => onSendTest(channel.type, recipient)}
                onClear={() => onClearConfig(channel.type)}
                isToggling={isTogglingChannel}
                isSaving={isSavingConfig}
                isTesting={isTestingConnection}
                isSendingTest={isSendingTest}
                isExpanded={expandedChannel === channel.type}
                onExpandToggle={() =>
                  setExpandedChannel(
                    expandedChannel === channel.type ? null : channel.type
                  )
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function NotificationSettingsCard({
  channelStatuses,
  onToggleChannel,
  onSaveConfig,
  onTestConnection,
  onSendTest,
  onClearConfig,
  getChannelConfig,
  isTogglingChannel,
  isSavingConfig,
  isTestingConnection,
  isSendingTest,
}: ChannelSettingsCardProps) {
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const otherChannels = channelStatuses?.filter(
    (c) => c.type !== "SMTP" && c.type !== "RESEND"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Notification Settings</CardTitle>
        </div>
        <CardDescription>
          Configure additional notification channels like webhooks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {otherChannels?.map((channel) => (
          <div key={channel.type} className="space-y-4">
            <ChannelTab
              channel={channel}
              config={getChannelConfig(channel.type)}
              onToggle={(enabled) => onToggleChannel(channel.type, enabled)}
              onSave={(enabled, config) =>
                onSaveConfig(channel.type, enabled, config)
              }
              onTest={() => onTestConnection(channel.type)}
              onSendTest={(recipient) => onSendTest(channel.type, recipient)}
              onClear={() => onClearConfig(channel.type)}
              isToggling={isTogglingChannel}
              isSaving={isSavingConfig}
              isTesting={isTestingConnection}
              isSendingTest={isSendingTest}
              isExpanded={expandedChannel === channel.type}
              onExpandToggle={() =>
                setExpandedChannel(
                  expandedChannel === channel.type ? null : channel.type
                )
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface ChannelTabProps {
  channel: ChannelStatus;
  config: ChannelConfig | undefined;
  onToggle: (enabled: boolean) => void;
  onSave: (enabled: boolean, config: Record<string, unknown> | null) => void;
  onTest: () => void;
  onSendTest: (recipient: string) => void;
  onClear: () => void;
  isToggling: boolean;
  isSaving: boolean;
  isTesting: boolean;
  isSendingTest: boolean;
  isExpanded: boolean;
  onExpandToggle: () => void;
}

function ChannelTab({
  channel,
  config,
  onToggle,
  onSave,
  onTest,
  onSendTest,
  onClear,
  isToggling,
  isSaving,
  isTesting,
  isSendingTest,
  isExpanded,
  onExpandToggle,
}: ChannelTabProps) {
  const [testRecipient, setTestRecipient] = useState("");

  return (
    <div className="space-y-4">
      {/* Status and Enable Toggle */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{channel.displayName}</span>
            {channel.hasEnvConfig && (
              <Badge variant="outline" className="text-xs bg-blue-500/5 text-blue-600 border-blue-200">
                Configured via Env
              </Badge>
            )}
            {channel.isConfigured ? (
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="mr-1 h-3 w-3" />
                Not Configured
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {channel.description}
            {(channel.type === "SMTP" || channel.type === "RESEND" || channel.type === "WEBHOOK") && (
              <>
                {" "}
                <Link
                  href={getDocsLink(channel.type === "WEBHOOK" ? "webhooks" : "notifications", "settings-channel")}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                  target="_blank"
                >
                  Learn more <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            )}
          </p>
          {!channel.hasEnvConfig && (channel.type === "SMTP" || channel.type === "RESEND") && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
              <Info className="h-3 w-3" />
              Tip: You can also configure this via environment variables.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {channel.type === "WEBHOOK" ? (
            <Switch
              checked={channel.isEnabled}
              onCheckedChange={onToggle}
              disabled={isToggling || !channel.isConfigured}
            />
          ) : channel.isEnabled ? (
            <>
              <Badge className="bg-green-500 hover:bg-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(false)}
                disabled={isToggling}
                className="h-8 text-xs text-muted-foreground"
              >
                Disable
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => onToggle(true)}
              disabled={isToggling || !channel.isConfigured}
              variant="outline"
            >
              Set as Active
            </Button>
          )}
        </div>
      </div>

      {/* Last Test Result */}
      {config?.lastTestAt && (
        <div
          className={`rounded-lg border p-3 ${
            config.lastTestSuccess
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
              : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            {config.lastTestSuccess ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span>
              Last tested: {new Date(config.lastTestAt).toLocaleString()}
            </span>
          </div>
          {config.lastTestError && (
            <p className="mt-1 text-xs text-red-600">{config.lastTestError}</p>
          )}
        </div>
      )}

      {/* Configuration */}
      <Collapsible open={isExpanded} onOpenChange={onExpandToggle}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>Configure {channel.displayName}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          {channel.type === "SMTP" && (
            <SmtpConfigForm
              config={config?.config as Record<string, unknown> | null}
              onSave={(newConfig) => onSave(channel.isEnabled, newConfig)}
              isSaving={isSaving}
            />
          )}
          {channel.type === "RESEND" && (
            <ResendConfigForm
              config={config?.config as Record<string, unknown> | null}
              onSave={(newConfig) => onSave(channel.isEnabled, newConfig)}
              isSaving={isSaving}
            />
          )}
          {channel.type === "WEBHOOK" && (
            <WebhookConfigForm
              config={config?.config as Record<string, unknown> | null}
              onSave={(newConfig) => onSave(channel.isEnabled, newConfig)}
              isSaving={isSaving}
            />
          )}

          {/* Test Actions */}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={!channel.isConfigured || isTesting}
            >
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>

            {channel.type !== "WEBHOOK" && (
              <div className="flex gap-2">
                <Input
                  placeholder="test@example.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-48"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendTest(testRecipient)}
                  disabled={!channel.isConfigured || !testRecipient || isSendingTest}
                >
                  {isSendingTest ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Test
                </Button>
              </div>
            )}

            {!channel.hasEnvConfig && channel.isConfigured && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onClear}
                className="ml-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Config
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================================================
// CONFIG FORMS
// ============================================================================

interface SmtpConfigFormProps {
  config: Record<string, unknown> | null;
  onSave: (config: Record<string, unknown>) => void;
  isSaving: boolean;
}

function SmtpConfigForm({ config, onSave, isSaving }: SmtpConfigFormProps) {
  const [host, setHost] = useState((config?.host as string) ?? "");
  const [port, setPort] = useState((config?.port as number)?.toString() ?? "587");
  const [user, setUser] = useState((config?.user as string) ?? "");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState((config?.secure as boolean) ?? true);
  const [fromEmail, setFromEmail] = useState((config?.fromEmail as string) ?? "");
  const [fromName, setFromName] = useState((config?.fromName as string) ?? "");

  const handleSave = () => {
    onSave({
      host,
      port: parseInt(port, 10),
      user,
      password: password || config?.password,
      secure,
      fromEmail,
      fromName,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="smtp-from-name">From Name</Label>
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
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save SMTP Settings
      </Button>
    </div>
  );
}

interface ResendConfigFormProps {
  config: Record<string, unknown> | null;
  onSave: (config: Record<string, unknown>) => void;
  isSaving: boolean;
}

function ResendConfigForm({ config, onSave, isSaving }: ResendConfigFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState((config?.fromEmail as string) ?? "");
  const [fromName, setFromName] = useState((config?.fromName as string) ?? "");

  const handleSave = () => {
    onSave({
      apiKey: apiKey || config?.apiKey,
      fromEmail,
      fromName,
    });
  };

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
      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="resend-from-name">From Name</Label>
          <Input
            id="resend-from-name"
            placeholder="Granyt Notifications"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Resend Settings
      </Button>
    </div>
  );
}

interface WebhookConfigFormProps {
  config: Record<string, unknown> | null;
  onSave: (config: Record<string, unknown>) => void;
  isSaving: boolean;
}

function WebhookConfigForm({ config, onSave, isSaving }: WebhookConfigFormProps) {
  const [url, setUrl] = useState((config?.url as string) ?? "");
  const [secret, setSecret] = useState("");

  const handleSave = () => {
    onSave({
      url,
      secret: secret || config?.secret || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook-url">Webhook URL</Label>
        <Input
          id="webhook-url"
          type="url"
          placeholder="https://your-app.com/webhook"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Notifications will be POSTed to this URL as JSON.{" "}
          <Link
            href={getDocsLink("webhooks", "settings-webhook")}
            className="text-primary hover:underline inline-flex items-center gap-1"
            target="_blank"
          >
            View payload documentation <ExternalLink className="h-3 w-3" />
          </Link>
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="webhook-secret">Secret (Optional)</Label>
        <Input
          id="webhook-secret"
          type="password"
          placeholder={config?.secret ? "••••••••" : "Optional signing secret"}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          If set, requests will include X-Granyt-Signature header (HMAC-SHA256)
        </p>
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Webhook Settings
      </Button>
    </div>
  );
}
