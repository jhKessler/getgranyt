"use client";

import { useState } from "react";
import Link from "next/link";
import { getDocsLink } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Mail,
  Bell,
  AlertTriangle,
  Globe,
  Play,
  Webhook,
  ChevronDown,
  Loader2,
  TestTube,
  Save,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ENVIRONMENT_FILTER_OPTIONS, type EnvironmentFilterValue } from "@/lib/notifications";
import { useChannelManagement } from "../_context";

interface EmailNotificationsCardProps {
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

export function EmailNotificationsCard({
  notificationSettings,
  onUpdateNotifications,
  filters,
  onUpdateFilters,
  hasEmailConfigured,
  defaultEnvironmentName,
  isUpdatingFilters,
}: EmailNotificationsCardProps) {
  const isDisabled = !hasEmailConfigured || isUpdatingFilters;

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
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Configure when you receive email alerts. Alerts still appear in your dashboard regardless of these settings.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {!hasEmailConfigured && (
          <Alert className="mb-4">
            <Mail className="h-4 w-4" />
            <AlertTitle>Email not configured</AlertTitle>
            <AlertDescription>
              Configure an email provider (SMTP or Resend) in the Email Setup section above to enable email notifications.
            </AlertDescription>
          </Alert>
        )}

        {/* Alert Emails */}
        <SettingRow
          icon={Bell}
          label="Alert Emails"
          description="Receive emails when data quality alerts occur"
          disabled={isDisabled}
        >
          <Switch
            checked={alertsEnabled}
            onCheckedChange={(checked) =>
              onUpdateNotifications([{ type: "ALL_ALERTS", enabled: checked }])
            }
            disabled={isDisabled}
          />
        </SettingRow>

        {/* Error Emails */}
        <SettingRow
          icon={AlertTriangle}
          label="Error Emails"
          description="Receive emails for DAG errors"
          disabled={isDisabled}
        >
          <Select
            value={getErrorValue()}
            onValueChange={handleErrorChange}
            disabled={isDisabled}
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
          disabled={isDisabled}
        >
          <Select
            value={filters?.environmentFilter ?? "all"}
            onValueChange={(value) =>
              onUpdateFilters({ environmentFilter: value as EnvironmentFilterValue })
            }
            disabled={isDisabled}
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
          disabled={isDisabled}
        >
          <Switch
            checked={filters?.includeManualRuns ?? true}
            onCheckedChange={(checked) =>
              onUpdateFilters({ includeManualRuns: checked })
            }
            disabled={isDisabled}
          />
        </SettingRow>

        {/* Webhook Section */}
        <div className="pt-4 border-t mt-4">
          <WebhookSection />
        </div>
      </CardContent>
    </Card>
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
