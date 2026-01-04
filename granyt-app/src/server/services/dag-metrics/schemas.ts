import { z } from "zod";
import type { JsonValue } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { MetricType, Aggregation } from "./types";

// ============================================================================
// ZOD SCHEMAS - Single source of truth for JSON field types
// ============================================================================

/**
 * Schema for MetricType enum
 */
export const MetricTypeSchema = z.nativeEnum(MetricType);

/**
 * Schema for Aggregation enum
 */
export const AggregationSchema = z.nativeEnum(Aggregation);

/**
 * Schema for MetricConfig - used in DagMetricsSettings.selectedMetrics
 */
export const MetricConfigSchema = z.object({
  id: z.string(),
  type: MetricTypeSchema,
  aggregation: AggregationSchema.optional(),
  enabled: z.boolean(),
  order: z.number(),
});

export const MetricConfigArraySchema = z.array(MetricConfigSchema);

/**
 * Schema for CustomMetricAggregation - individual metric aggregation data
 */
export const CustomMetricAggregationSchema = z.object({
  sum: z.number(),
  count: z.number(),
  lastValue: z.number().optional(),
});

/**
 * Schema for customMetrics field in DagComputedMetrics
 */
export const CustomMetricsRecordSchema = z.record(
  z.string(),
  CustomMetricAggregationSchema
);

// ============================================================================
// TYPE EXPORTS - Inferred from Zod schemas (use these for type safety)
// ============================================================================

export type MetricConfigFromSchema = z.infer<typeof MetricConfigSchema>;
export type CustomMetricAggregationFromSchema = z.infer<typeof CustomMetricAggregationSchema>;
export type CustomMetricsRecord = z.infer<typeof CustomMetricsRecordSchema>;

// ============================================================================
// PARSING HELPERS - Use these to safely parse Prisma JSON fields
// ============================================================================

/**
 * Parse selectedMetrics from Prisma JSON field
 * Returns parsed array or throws if invalid
 */
export function parseSelectedMetrics(json: JsonValue): MetricConfigFromSchema[] {
  return MetricConfigArraySchema.parse(json);
}

/**
 * Safely parse selectedMetrics, returns null if invalid
 */
export function safeParseSelectedMetrics(json: JsonValue): MetricConfigFromSchema[] | null {
  const result = MetricConfigArraySchema.safeParse(json);
  return result.success ? result.data : null;
}

/**
 * Parse customMetrics from Prisma JSON field
 * Returns parsed record or null if invalid/null
 */
export function parseCustomMetrics(
  json: JsonValue | null | undefined
): CustomMetricsRecord | null {
  if (json === null || json === undefined) return null;
  const result = CustomMetricsRecordSchema.safeParse(json);
  return result.success ? result.data : null;
}

// ============================================================================
// SERIALIZATION HELPERS - Use these to prepare data for Prisma JSON fields
// ============================================================================

/**
 * Serialize MetricConfig[] for Prisma JSON field
 * Validates the data matches schema before returning
 */
export function serializeSelectedMetrics(metrics: MetricConfigFromSchema[]): Prisma.InputJsonValue {
  // Validate before serializing to catch schema mismatches early
  MetricConfigArraySchema.parse(metrics);
  return metrics as unknown as Prisma.InputJsonValue;
}

/**
 * Serialize CustomMetricsRecord for Prisma JSON field
 * Returns undefined if null (Prisma will use default/null)
 */
export function serializeCustomMetrics(
  metrics: CustomMetricsRecord | null | undefined
): Prisma.InputJsonValue | undefined {
  if (metrics === null || metrics === undefined) return undefined;
  // Validate before serializing
  CustomMetricsRecordSchema.parse(metrics);
  return metrics as unknown as Prisma.InputJsonValue;
}
