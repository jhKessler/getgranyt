"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wind, Save, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";

interface AirflowSettingsCardProps {
  airflowUrl: string | null | undefined;
  onSave: (url: string) => void;
  isSaving: boolean;
}

export function AirflowSettingsCard({
  airflowUrl,
  onSave,
  isSaving,
}: AirflowSettingsCardProps) {
  const [url, setUrl] = useState(airflowUrl || "");
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when prop changes
  useEffect(() => {
    setUrl(airflowUrl || "");
    setHasChanges(false);
  }, [airflowUrl]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setHasChanges(value !== (airflowUrl || ""));
  };

  const handleSave = () => {
    onSave(url);
    setHasChanges(false);
  };

  const isValidUrl = url === "" || isValidHttpUrl(url);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wind className="h-5 w-5" />
          <CardTitle>Airflow Integration</CardTitle>
        </div>
        <CardDescription>
          Configure your Airflow webserver URL to enable direct links to DAGs and runs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="airflowUrl">Airflow Webserver URL</Label>
          <div className="flex gap-2">
            <Input
              id="airflowUrl"
              type="url"
              placeholder="https://airflow.example.com"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={!isValidUrl ? "border-red-500" : ""}
            />
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges || !isValidUrl}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="ml-2">Save</span>
            </Button>
          </div>
          {!isValidUrl && (
            <p className="text-xs text-red-500">
              Please enter a valid URL (e.g., https://airflow.example.com)
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            This URL will be used to generate links to your DAGs and runs in the Airflow UI.
            Leave empty to disable Airflow links.
          </p>
        </div>

        {airflowUrl && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-md border border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-400">
              Airflow integration is configured
            </span>
            <a
              href={airflowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Open Airflow <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function isValidHttpUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
