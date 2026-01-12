"use client";

import { useState } from "react";
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

interface EnvironmentAirflowSettings {
  id: string;
  name: string;
  airflowUrl: string | null;
}

interface AirflowSettingsCardProps {
  environments: EnvironmentAirflowSettings[];
  onSave: (environmentId: string, url: string) => void;
  isSaving: boolean;
  savingEnvironmentId: string | null;
}

export function AirflowSettingsCard({
  environments,
  onSave,
  isSaving,
  savingEnvironmentId,
}: AirflowSettingsCardProps) {
  const [editedUrls, setEditedUrls] = useState<Record<string, string>>({});

  const getDisplayUrl = (env: EnvironmentAirflowSettings) => {
    return editedUrls[env.id] ?? env.airflowUrl ?? "";
  };

  const hasChanges = (env: EnvironmentAirflowSettings) => {
    const edited = editedUrls[env.id];
    if (edited === undefined) return false;
    return edited !== (env.airflowUrl ?? "");
  };

  const handleUrlChange = (envId: string, value: string) => {
    setEditedUrls((prev) => ({ ...prev, [envId]: value }));
  };

  const handleSave = (env: EnvironmentAirflowSettings) => {
    const url = editedUrls[env.id] ?? env.airflowUrl ?? "";
    onSave(env.id, url);
    // Clear edit state after save
    setEditedUrls((prev) => {
      const next = { ...prev };
      delete next[env.id];
      return next;
    });
  };

  const isValidUrl = (url: string) => {
    if (url === "") return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wind className="h-5 w-5" />
          <CardTitle>Airflow Integration</CardTitle>
        </div>
        <CardDescription>
          Configure Airflow webserver URLs for each environment to enable direct
          links to DAGs and runs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {environments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No environments configured. Create an environment first to configure
            Airflow URLs.
          </p>
        ) : (
          environments.map((env) => {
            const displayUrl = getDisplayUrl(env);
            const urlIsValid = isValidUrl(displayUrl);
            const envHasChanges = hasChanges(env);
            const isSavingThis = isSaving && savingEnvironmentId === env.id;

            return (
              <div key={env.id} className="space-y-2">
                <Label
                  htmlFor={`airflow-${env.id}`}
                  className="capitalize font-medium"
                >
                  {env.name} Environment
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`airflow-${env.id}`}
                    type="url"
                    placeholder="https://airflow.example.com"
                    value={displayUrl}
                    onChange={(e) => handleUrlChange(env.id, e.target.value)}
                    className={!urlIsValid ? "border-red-500" : ""}
                  />
                  <Button
                    onClick={() => handleSave(env)}
                    disabled={isSaving || !envHasChanges || !urlIsValid}
                  >
                    {isSavingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="ml-2">Save</span>
                  </Button>
                </div>
                {!urlIsValid && (
                  <p className="text-xs text-red-500">
                    Please enter a valid URL (e.g., https://airflow.example.com)
                  </p>
                )}
                {env.airflowUrl && !envHasChanges && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Configured</span>
                    <a
                      href={env.airflowUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
