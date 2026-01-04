export interface DagContext {
  organizationId: string;
  environment?: string | null;
  srcDagId: string;
  srcTaskId?: string | null;
  srcRunId?: string | null;
  namespace?: string;
  timestamp: Date;
  operator?: string | null;
}

export interface EnsureDagParams {
  organizationId: string;
  srcDagId: string;
  namespace: string;
  timestamp: Date;
  schedule?: string | null;
}

export interface FindOrCreateDagRunParams {
  organizationId: string;
  srcDagId: string;
  srcRunId: string;
  namespace?: string;
  timestamp: Date;
  environment?: string | null;
}

export interface FindOrCreateTaskRunParams {
  organizationId: string;
  dagRunId: string;
  srcTaskId: string;
  operator?: string | null;
  environment?: string | null;
}
