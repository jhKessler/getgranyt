import type { MetricsPayload } from "@/lib/validators";

export interface IngestMetricsParams {
  organizationId: string;
  environment?: string | null;
  payload: MetricsPayload;
}

export interface IngestMetricsResult {
  captureId: string;
  taskRunId: string;
}
