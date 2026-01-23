"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Globe, Play } from "lucide-react";
import { ENVIRONMENT_FILTER_OPTIONS, type EnvironmentFilterValue } from "@/lib/notifications";

interface NotificationFiltersCardProps {
  filters: {
    environmentFilter: EnvironmentFilterValue;
    includeManualRuns: boolean;
  } | undefined;
  onUpdate: (updates: {
    environmentFilter?: EnvironmentFilterValue;
    includeManualRuns?: boolean;
  }) => void;
  hasEmailConfigured: boolean;
  defaultEnvironmentName?: string;
  isUpdating?: boolean;
}

export function NotificationFiltersCard({
  filters,
  onUpdate,
  hasEmailConfigured,
  defaultEnvironmentName,
  isUpdating,
}: NotificationFiltersCardProps) {
  const isDisabled = !hasEmailConfigured || isUpdating;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Email Filters</CardTitle>
            <CardDescription>
              Control when email notifications are sent. Alerts still appear in the dashboard.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Environment Filter */}
        <div
          className={`flex items-center justify-between rounded-lg p-4 transition-colors ${
            isDisabled ? "opacity-50" : "hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label>Environment Filter</Label>
              <p className="text-sm text-muted-foreground">
                Choose which environments trigger email notifications
              </p>
              {defaultEnvironmentName && filters?.environmentFilter === "default_only" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Emails will only be sent for: <span className="font-medium">{defaultEnvironmentName}</span>
                </p>
              )}
            </div>
          </div>
          <Select
            value={filters?.environmentFilter ?? "all"}
            onValueChange={(value) => onUpdate({ environmentFilter: value as EnvironmentFilterValue })}
            disabled={isDisabled}
          >
            <SelectTrigger className="w-[220px]">
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
        </div>

        {/* Manual Run Filter */}
        <div
          className={`flex items-center justify-between rounded-lg p-4 transition-colors ${
            isDisabled ? "opacity-50" : "hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <Play className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="include-manual-runs">Manual Run Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for manually triggered DAG runs
              </p>
            </div>
          </div>
          <Switch
            id="include-manual-runs"
            checked={filters?.includeManualRuns ?? true}
            onCheckedChange={(checked) => onUpdate({ includeManualRuns: checked })}
            disabled={isDisabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
