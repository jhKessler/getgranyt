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
import { SmtpConfigForm, ResendConfigForm } from "@/components/shared";
import { useChannelManagement } from "../_context";

import {
  Mail,
  Send,
  Webhook,
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

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  SMTP: Mail,
  RESEND: Send,
  WEBHOOK: Webhook,
};

export function EmailSetupCard() {
  const {
    channelStatuses,
    getChannelConfig,
    toggleChannel,
    saveConfig,
    testConnection,
    sendTest,
    clearConfig,
    isToggling,
    isSaving,
    isTesting,
    isSendingTest,
  } = useChannelManagement();

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
                onToggle={(enabled) => toggleChannel(channel.type, enabled)}
                onSave={(enabled, config) =>
                  saveConfig(channel.type, enabled, config)
                }
                onTest={() => testConnection(channel.type)}
                onSendTest={(recipient) => sendTest(channel.type, recipient)}
                onClear={() => clearConfig(channel.type)}
                isToggling={isToggling}
                isSaving={isSaving}
                isTesting={isTesting}
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
