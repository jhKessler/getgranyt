"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell } from "lucide-react";
import {
  NOTIFICATION_CATEGORIES,
  isSwitchSetting,
  isSelectSetting,
  type NotificationSettingConfig,
} from "@/lib/notifications";

interface NotificationPreferencesCardProps {
  settings: Record<string, boolean> | undefined;
  onUpdate: (updates: Array<{ type: string; enabled: boolean }>) => void;
}

function SwitchSettingRow({
  setting,
  settings,
  onUpdate,
}: {
  setting: NotificationSettingConfig;
  settings: Record<string, boolean> | undefined;
  onUpdate: (updates: Array<{ type: string; enabled: boolean }>) => void;
}) {
  if (!isSwitchSetting(setting)) return null;

  const Icon = setting.icon;
  const isEnabled = settings?.[setting.type] ?? setting.defaultEnabled;

  // Check if parent is disabled (for child settings)
  const parentEnabled = setting.parentType
    ? (settings?.[setting.parentType] ?? true)
    : true;
  const isDisabledByParent = !!setting.parentType && !parentEnabled;
  const isIndented = !!setting.parentType;

  return (
    <div
      className={`flex items-center justify-between rounded-lg p-4 transition-colors ${
        isIndented ? "ml-6 border-l-2 border-muted" : ""
      } ${isDisabledByParent ? "opacity-50" : "hover:bg-muted/50"}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${setting.isParent ? "text-primary" : "text-muted-foreground"}`} />
        <div>
          <Label htmlFor={setting.type} className="cursor-pointer">
            {setting.label}
          </Label>
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        </div>
      </div>
      <Switch
        id={setting.type}
        checked={isEnabled}
        onCheckedChange={(checked) => onUpdate([{ type: setting.type, enabled: checked }])}
        disabled={isDisabledByParent}
      />
    </div>
  );
}

function SelectSettingRow({
  setting,
  settings,
  onUpdate,
}: {
  setting: NotificationSettingConfig;
  settings: Record<string, boolean> | undefined;
  onUpdate: (updates: Array<{ type: string; enabled: boolean }>) => void;
}) {
  if (!isSelectSetting(setting)) return null;

  const Icon = setting.icon;
  const currentValue = setting.fromSettings(settings ?? {});

  const handleValueChange = (value: string) => {
    const updates = setting.toSettingsUpdate(value);
    onUpdate(updates);
  };

  return (
    <div className="flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-primary" />
        <div>
          <Label>{setting.label}</Label>
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        </div>
      </div>
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {setting.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function NotificationPreferencesCard({ settings, onUpdate }: NotificationPreferencesCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose which events trigger email notifications
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {NOTIFICATION_CATEGORIES.flatMap((category) =>
          category.settings.map((setting) =>
            isSwitchSetting(setting) ? (
              <SwitchSettingRow
                key={setting.type}
                setting={setting}
                settings={settings}
                onUpdate={onUpdate}
              />
            ) : (
              <SelectSettingRow
                key={setting.type}
                setting={setting}
                settings={settings}
                onUpdate={onUpdate}
              />
            )
          )
        )}
      </CardContent>
    </Card>
  );
}
