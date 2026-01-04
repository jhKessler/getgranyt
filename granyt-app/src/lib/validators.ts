import { z } from "zod";

// ============================================================================
// METRICS VALIDATORS
// ============================================================================

// ISO 8601 datetime regex that supports both 'Z' and '+00:00' timezone formats
const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

// Metrics must be flat 1D key-value pairs with primitive values only (no nested objects/arrays)
const metricsValuesSchema = z.record(
  z.string(), 
  z.union([
    z.number(), 
    z.string(), 
    z.boolean(), 
    z.null(),
  ])
).nullable().optional();

// Schema contains DataFrame structure info with column metadata
const schemaFieldSchema = z.object({
  column_dtypes: z.record(z.string(), z.string()), // Required: {column_name: dtype}
  null_counts: z.record(z.string(), z.number()).optional(), // Optional: {column_name: count}
  empty_string_counts: z.record(z.string(), z.number()).optional(), // Optional: {column_name: count}
}).nullable().optional();

export const metricsPayloadSchema = z.object({
  capture_id: z.string().min(1, "Capture ID is required"),
  captured_at: z.string().regex(iso8601Regex, { message: "Invalid datetime format" }),
  dag_id: z.string(),
  task_id: z.string(),
  run_id: z.string(),
  metrics: metricsValuesSchema, // Flat metrics as flexible JSON
  schema: schemaFieldSchema, // DataFrame schema info (column_dtypes, null_counts, empty_string_counts)
});

export type MetricsPayload = z.infer<typeof metricsPayloadSchema>;

// ============================================================================
// ERROR EVENT VALIDATORS
// ============================================================================

export const sourceContextSchema = z.object({
  lineno: z.number().int(),
  code: z.string(),
  current: z.boolean(),
});

export const stacktraceFrameSchema = z.object({
  filename: z.string(),
  function: z.string(),
  lineno: z.number().int(),
  module: z.string().optional(),
  source_context: z.array(sourceContextSchema).optional(),
  // locals can contain any JSON value (string, number, null, object, array, etc.)
  locals: z.record(z.unknown()).optional(),
});

export const exceptionSchema = z.object({
  type: z.string().min(1, "Exception type is required"),
  message: z.string(),
  module: z.string().nullable().optional(),
  args: z.array(z.string()).optional(),
});

export const taskInstanceSchema = z.object({
  dag_id: z.string().min(1, "DAG ID is required"),
  task_id: z.string().min(1, "Task ID is required"),
  run_id: z.string().min(1, "Run ID is required"),
  operator: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  try_number: z.number().int().positive().nullable().optional(),
  execution_date: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});

export const systemInfoSchema = z.object({
  python_version: z.string().optional(),
  airflow_version: z.string().optional(),
  platform: z.string().optional(),
  hostname: z.string().optional(),
  os_name: z.string().optional(),
  os_version: z.string().optional(),
});

export const errorEventSchema = z.object({
  error_id: z.string().uuid("Invalid error ID format"),
  timestamp: z.string().regex(iso8601Regex, { message: "Invalid timestamp format" }),
  exception: exceptionSchema,
  stacktrace: z.array(stacktraceFrameSchema).optional(),
  task_instance: taskInstanceSchema.optional(),
  system: systemInfoSchema.optional(),
  sdk_version: z.string().optional(),
});

export const errorPayloadSchema = z.object({
  errors: z.array(errorEventSchema).min(1, "At least one error is required"),
}).or(z.array(errorEventSchema).min(1)).or(errorEventSchema);

export type ErrorEvent = z.infer<typeof errorEventSchema>;
export type StacktraceFrame = z.infer<typeof stacktraceFrameSchema>;
export type TaskInstance = z.infer<typeof taskInstanceSchema>;

// ============================================================================
// OPENLINEAGE EVENT VALIDATORS
// ============================================================================

export const openlineageJobSchema = z.object({
  namespace: z.string().min(1, "Job namespace is required"),
  name: z.string().min(1, "Job name is required"),
  facets: z.record(z.unknown()).optional(),
});

export const openlineageRunFacetsSchema = z.object({
  nominalTime: z.object({
    _producer: z.string(),
    _schemaURL: z.string(),
    nominalStartTime: z.string().optional(),
    nominalEndTime: z.string().optional(),
  }).optional(),
  parent: z.object({
    _producer: z.string(),
    _schemaURL: z.string(),
    run: z.object({
      runId: z.string(),
    }),
    job: z.object({
      namespace: z.string(),
      name: z.string(),
    }),
  }).optional(),
  errorMessage: z.object({
    _producer: z.string(),
    _schemaURL: z.string(),
    message: z.string(),
    programmingLanguage: z.string().optional(),
    stackTrace: z.string().optional(),
  }).optional(),
}).passthrough(); // Allow additional facets

export const openlineageRunSchema = z.object({
  // runId can be a UUID or an Airflow-style run ID (e.g., "manual__2025-12-21T13:55:42.409928+00:00")
  runId: z.string().min(1, "Run ID is required"),
  facets: openlineageRunFacetsSchema.optional(),
});

export const openlineageDatasetFacetsSchema = z.object({
  schema: z.object({
    _producer: z.string(),
    _schemaURL: z.string(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string().optional(),
    })).optional(),
  }).optional(),
  dataSource: z.object({
    _producer: z.string(),
    _schemaURL: z.string(),
    name: z.string().optional(),
    uri: z.string().optional(),
  }).optional(),
}).passthrough(); // Allow additional facets

export const openlineageDatasetSchema = z.object({
  namespace: z.string(),
  name: z.string(),
  facets: openlineageDatasetFacetsSchema.optional(),
});

export const openlineageEventSchema = z.object({
  eventType: z.enum(["START", "RUNNING", "COMPLETE", "ABORT", "FAIL", "OTHER"], {
    errorMap: () => ({ message: "Invalid event type. Must be one of: START, RUNNING, COMPLETE, ABORT, FAIL, OTHER" }),
  }),
  eventTime: z.string().regex(iso8601Regex, { message: "Invalid event time format" }),
  producer: z.string().url("Producer must be a valid URL"),
  schemaURL: z.string().url("Schema URL must be a valid URL"),
  job: openlineageJobSchema,
  run: openlineageRunSchema,
  inputs: z.array(openlineageDatasetSchema).optional(),
  outputs: z.array(openlineageDatasetSchema).optional(),
});

export type OpenLineageEvent = z.infer<typeof openlineageEventSchema>;
export type OpenLineageJob = z.infer<typeof openlineageJobSchema>;
export type OpenLineageRun = z.infer<typeof openlineageRunSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats Zod validation errors into a readable string
 */
export function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    })
    .join("; ");
}

/**
 * Validates data and returns either the parsed data or an error response
 */
export function validatePayload<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: formatZodErrors(result.error),
    details: result.error,
  };
}
