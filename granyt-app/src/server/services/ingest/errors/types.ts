import type { ErrorEvent } from "@/lib/validators";

export interface IngestErrorParams {
  organizationId: string;
  environment?: string | null;
  event: ErrorEvent;
}

export interface IngestErrorResult {
  errorId: string;
  generalErrorId: string;
  taskRunId: string;
}
