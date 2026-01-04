import { z } from "zod";
import { logger } from "./logger";

// ============================================================================
// ZOD SCHEMAS FOR JSON DATABASE COLUMNS
// These schemas are used to validate and parse JSON columns from Prisma
// ============================================================================

/**
 * Schema for metrics stored in Metric.metrics
 * All metrics are stored as flexible 1D key-value pairs
 */
export const metricsJsonSchema = z.record(
  z.string(), 
  z.union([
    z.number(), 
    z.string(), 
    z.boolean(), 
    z.null(),
  ])
).nullable();

export type MetricsJson = z.infer<typeof metricsJsonSchema>;

/**
 * Schema for the new Metric.schema column
 */
export const schemaJsonSchema = z.object({
  column_dtypes: z.record(z.string(), z.string()),
  null_counts: z.record(z.string(), z.number().nullable()).optional(),
  empty_string_counts: z.record(z.string(), z.number().nullable()).optional(),
}).nullable();

export type SchemaJson = z.infer<typeof schemaJsonSchema>;

/**
 * Normalized column metric type with null instead of undefined
 */
export type ColumnMetricDb = {
  name: string;
  dtype: string;
  null_count: number | null;
  empty_string_count: number | null;
};

// ============================================================================
// PARSE FUNCTIONS
// These functions safely parse JSON values from Prisma with validation
// ============================================================================

/**
 * Parse metrics JSON from database with Zod validation
 */
export function parseMetricsJson(value: unknown): Record<string, unknown> {
  const result = metricsJsonSchema.safeParse(value);
  if (!result.success) {
    logger.warn({ error: result.error.message }, "Failed to parse metrics JSON");
    return {};
  }
  return result.data ?? {};
}

/**
 * Parse schema JSON from database with Zod validation
 */
export function parseSchemaJson(value: unknown): SchemaJson {
  const result = schemaJsonSchema.safeParse(value);
  if (!result.success) {
    logger.warn({ error: result.error.message }, "Failed to parse schema JSON");
    return null;
  }
  return result.data;
}

/**
 * Parse columns from the new schema JSON format
 */
export function parseColumnsFromSchema(schema: unknown): ColumnMetricDb[] {
  const parsed = parseSchemaJson(schema);
  if (!parsed) return [];

  const { column_dtypes, null_counts, empty_string_counts } = parsed;
  
  return Object.entries(column_dtypes).map(([name, dtype]) => ({
    name,
    dtype,
    null_count: null_counts?.[name] ?? null,
    empty_string_count: empty_string_counts?.[name] ?? null,
  }));
}

/**
 * Get numeric metric value from metrics JSON
 */
export function getNumericMetric(metrics: Record<string, unknown>, key: string): number | null {
  const value = metrics?.[key];
  if (typeof value === "number") return value;
  return null;
}

