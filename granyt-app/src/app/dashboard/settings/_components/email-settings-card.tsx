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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmtpConfigForm, ResendConfigForm } from "@/components/shared";
import { useChannelManagement } from "../_context";
import { ENVIRONMENT_FILTER_OPTIONS, type EnvironmentFilterValue } from "@/lib/notifications";

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
  Bell,
  AlertTriangle,
  Globe,
  Play,
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

interface EmailSettingsCardProps {
  notificationSettings: Record<string, boolean> | undefined;
  onUpdateNotifications: (updates: Array<{ type: string; enabled: boolean }>) => void;
  filters: {
    environmentFilter: EnvironmentFilterValue;
    includeManualRuns: boolean;
  } | undefined;
  onUpdateFilters: (updates: {
    environmentFilter?: EnvironmentFilterValue;
    includeManualRuns?: boolean;
  }) => void;
  hasEmailConfigured: boolean;
  defaultEnvironmentName?: string;
  isUpdatingFilters?: boolean;
}

export function EmailSettingsCard({
  notificationSettings,
  onUpdateNotifications,
  filters,
  onUpdateFilters,
  hasEmailConfigured,
  defaultEnvironmentName,
  isUpdatingFilters,
}: EmailSettingsCardProps) {
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

  const isNotificationsDisabled = !hasEmailConfigured || isUpdatingFilters;

  const alertsEnabled = notificationSettings?.["ALL_ALERTS"] ?? true;

  const getErrorValue = () => {
    const allErrors = notificationSettings?.["ALL_ERRORS"] ?? false;
    const newErrorsOnly = notificationSettings?.["NEW_ERRORS_ONLY"] ?? false;
    if (newErrorsOnly) return "new_errors";
    if (allErrors) return "all_errors";
    return "disabled";
  };

  const handleErrorChange = (value: string) => {
    switch (value) {
      case "disabled":
        onUpdateNotifications([
          { type: "ALL_ERRORS", enabled: false },
          { type: "NEW_ERRORS_ONLY", enabled: false },
        ]);
        break;
      case "new_errors":
        onUpdateNotifications([
          { type: "ALL_ERRORS", enabled: false },
          { type: "NEW_ERRORS_ONLY", enabled: true },
        ]);
        break;
      case "all_errors":
        onUpdateNotifications([
          { type: "ALL_ERRORS", enabled: true },
          { type: "NEW_ERRORS_ONLY", enabled: false },
        ]);
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>Email Settings</CardTitle>
        </div>
        <CardDescription>
          Configure your email provider and notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Setup Section */}
        <div>
          <h3 className="text-sm font-medium mb-3">Email Provider</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure your email provider. Only one can be active at a time.
          </p>
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
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Notification Preferences Section */}
        <div>
          <h3 className="text-sm font-medium mb-3">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure when you receive email alerts. Alerts still appear in your dashboard regardless of these settings.
          </p>

          {!hasEmailConfigured && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 p-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                <Mail className="h-4 w-4" />
                <span>Configure an email provider above to enable email notifications.</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {/* Alert Emails */}
            <SettingRow
              icon={Bell}
              label="Alert Emails"
              description="Receive emails when data quality alerts occur"
              disabled={isNotificationsDisabled}
            >
              <Switch
                checked={alertsEnabled}
                onCheckedChange={(checked) =>
                  onUpdateNotifications([{ type: "ALL_ALERTS", enabled: checked }])
                }
                disabled={isNotificationsDisabled}
              />
            </SettingRow>

            {/* Error Emails */}
            <SettingRow
              icon={AlertTriangle}
              label="Error Emails"
              description="Receive emails for DAG errors"
              disabled={isNotificationsDisabled}
            >
              <Select
                value={getErrorValue()}
                onValueChange={handleErrorChange}
                disabled={isNotificationsDisabled}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="new_errors">New Errors Only</SelectItem>
                  <SelectItem value="all_errors">All Errors</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            {/* Environment Filter */}
            <SettingRow
              icon={Globe}
              label="Environment Filter"
              description="Which environments trigger email notifications"
              hint={
                defaultEnvironmentName && filters?.environmentFilter === "default_only"
                  ? `Emails will only be sent for: ${defaultEnvironmentName}`
                  : undefined
              }
              disabled={isNotificationsDisabled}
            >
              <Select
                value={filters?.environmentFilter ?? "all"}
                onValueChange={(value) =>
                  onUpdateFilters({ environmentFilter: value as EnvironmentFilterValue })
                }
                disabled={isNotificationsDisabled}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENT_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>

            {/* Manual Run Emails */}
            <SettingRow
              icon={Play}
              label="Manual Run Emails"
              description="Receive emails for manually triggered DAG runs"
              disabled={isNotificationsDisabled}
            >
              <Switch
                checked={filters?.includeManualRuns ?? true}
                onCheckedChange={(checked) =>
                  onUpdateFilters({ includeManualRuns: checked })
                }
                disabled={isNotificationsDisabled}
              />
            </SettingRow>

            {/* Webhook Section */}
            <div className="pt-4 border-t mt-4">
              <WebhookSection />
            </div>
          </div>
        </div>
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
            {(channel.type === "SMTP" || channel.type === "RESEND") && (
              <>
                {" "}
                <Link
                  href={getDocsLink("notifications", "settings-channel")}
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
          {channel.isEnabled ? (
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

interface SettingRowProps {
  icon: React.ElementType;
  label: string;
  description: string;
  hint?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

function SettingRow({ icon: Icon, label, description, hint, disabled, children }: SettingRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg p-4 transition-colors ${
        disabled ? "opacity-50" : "hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <Label>{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function WebhookSection() {
  const {
    channelStatuses,
    getChannelConfig,
    toggleChannel,
    saveConfig,
    testConnection,
    clearConfig,
    isToggling,
    isSaving,
    isTesting,
  } = useChannelManagement();

  const [isExpanded, setIsExpanded] = useState(false);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");

  const webhookChannel = channelStatuses?.find((c) => c.type === "WEBHOOK");
  const webhookConfig = getChannelConfig("WEBHOOK");

  const handleSave = () => {
    saveConfig("WEBHOOK", webhookChannel?.isEnabled ?? false, {
      url,
      secret: secret || webhookConfig?.config?.secret || undefined,
    });
  };

  // Initialize form values when config loads
  const configUrl = webhookConfig?.config?.url as string | undefined;
  if (configUrl && !url) {
    setUrl(configUrl);
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <div className="flex items-center gap-3">
            <Webhook className="h-4 w-4 text-muted-foreground" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium">Webhook</span>
                <span className="text-sm text-muted-foreground">(Optional)</span>
                {webhookChannel?.isConfigured && webhookChannel?.isEnabled && (
                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                Also send notifications to an external endpoint
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4 space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Enable Webhook</span>
              {webhookChannel?.isConfigured ? (
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
              Send notifications to your webhook URL.{" "}
              <Link
                href={getDocsLink("webhooks", "settings-webhook")}
                className="text-primary hover:underline inline-flex items-center gap-1"
                target="_blank"
              >
                Learn more <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          </div>
          <Switch
            checked={webhookChannel?.isEnabled ?? false}
            onCheckedChange={(enabled) => toggleChannel("WEBHOOK", enabled)}
            disabled={isToggling || !webhookChannel?.isConfigured}
          />
        </div>

        {/* Last Test Result */}
        {webhookConfig?.lastTestAt && (
          <div
            className={`rounded-lg border p-3 ${
              webhookConfig.lastTestSuccess
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
            }`}
          >
            <div className="flex items-center gap-2 text-sm">
              {webhookConfig.lastTestSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span>
                Last tested: {new Date(webhookConfig.lastTestAt).toLocaleString()}
              </span>
            </div>
            {webhookConfig.lastTestError && (
              <p className="mt-1 text-xs text-red-600">{webhookConfig.lastTestError}</p>
            )}
          </div>
        )}

        {/* Webhook Configuration */}
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
              placeholder={webhookConfig?.config?.secret ? "••••••••" : "Optional signing secret"}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If set, requests will include X-Granyt-Signature header (HMAC-SHA256)
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={isSaving || !url}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Webhook
            </Button>

            <Button
              variant="outline"
              onClick={() => testConnection("WEBHOOK")}
              disabled={!webhookChannel?.isConfigured || isTesting}
            >
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>

            {webhookChannel?.isConfigured && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => clearConfig("WEBHOOK")}
                className="ml-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
