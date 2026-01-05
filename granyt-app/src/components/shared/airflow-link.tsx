"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AirflowLinkProps {
  airflowUrl: string | null | undefined;
  dagId: string;
  runId?: string;
  taskId?: string;
  variant?: "button" | "icon" | "text";
  size?: "sm" | "default";
  className?: string;
}

/**
 * Constructs the appropriate Airflow URL based on context:
 * - DAG page: {baseUrl}/dags/{dagId}/grid
 * - DAG Run grid view: {baseUrl}/dags/{dagId}/grid?dag_run_id={runId}
 * - Task instance: {baseUrl}/dags/{dagId}/grid?dag_run_id={runId}&task_id={taskId}
 */
function buildAirflowUrl(
  baseUrl: string,
  dagId: string,
  runId?: string,
  taskId?: string
): string {
  // Start with base DAG grid URL
  let url = `${baseUrl}/dags/${encodeURIComponent(dagId)}/grid`;

  // If we have a run ID, add it as a query param to select that run
  if (runId) {
    url += `?dag_run_id=${encodeURIComponent(runId)}`;

    // If we also have a task ID, add it to the URL
    if (taskId) {
      url += `&task_id=${encodeURIComponent(taskId)}`;
    }
  }

  return url;
}

export function AirflowLink({
  airflowUrl,
  dagId,
  runId,
  taskId,
  variant = "button",
  size = "default",
  className,
}: AirflowLinkProps) {
  // Don't render if no Airflow URL is configured
  if (!airflowUrl) {
    return null;
  }

  const url = buildAirflowUrl(airflowUrl, dagId, runId, taskId);

  const tooltipText = taskId
    ? "View task in Airflow"
    : runId
    ? "View run in Airflow"
    : "View DAG in Airflow";

  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "text") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors",
          size === "sm" ? "text-xs" : "text-sm",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        View in Airflow
        <ExternalLink className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      </a>
    );
  }

  // Default: button variant
  return (
    <Button
      variant="outline"
      size={size}
      asChild
      className={className}
      onClick={(e) => e.stopPropagation()}
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className={size === "sm" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"} />
        View in Airflow
      </a>
    </Button>
  );
}
