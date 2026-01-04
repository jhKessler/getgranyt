import type { OpenLineageEvent } from "@/lib/validators";

export interface IngestLineageParams {
  organizationId: string;
  environment?: string | null;
  event: OpenLineageEvent;
}

export interface IngestLineageResult {
  eventType: string;
  isTaskLevel: boolean;
  srcDagId: string;
  srcTaskId?: string;
}

export interface TaskLevelEventParams {
  organizationId: string;
  environment?: string | null;
  srcDagId: string;
  srcTaskId: string;
  namespace: string;
  srcRunId: string;
  eventType: string;
  eventTime: Date;
  facets?: Record<string, unknown>;
}

export interface DagLevelEventParams {
  organizationId: string;
  environment?: string | null;
  srcDagId: string;
  namespace: string;
  srcRunId: string;
  eventType: string;
  eventTime: Date;
  schedule?: string | null;
}
