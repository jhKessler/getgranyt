import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getUserOrganization } from "../services/dashboard";
import {
  getMetricsSettings,
  saveMetricsSettings,
  deleteMetricsSettings,
  hasDagOverride,
  getAvailableMetrics,
  getComputedMetrics,
  MetricType,
  Aggregation,
  BUILTIN_METRICS,
} from "../services/dag-metrics";
import { Timeframe } from "../services/dashboard/types";

// Zod schemas for validation
const metricConfigSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(MetricType),
  aggregation: z.nativeEnum(Aggregation).optional(),
  enabled: z.boolean(),
  order: z.number(),
});

export const dagMetricsRouter = router({
  /**
   * Get the user's metrics settings for a DAG.
   * Falls back to default settings if no DAG-specific override exists.
   */
  getSettings: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        dagId: z.string().optional().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getMetricsSettings({
        userId: ctx.user.id,
        organizationId: org.id,
        dagId: input.dagId,
      });
    }),

  /**
   * Save metrics settings.
   * Pass dagId=null for default settings, or a specific dagId for overrides.
   */
  saveSettings: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        dagId: z.string().optional().nullable(),
        selectedMetrics: z.array(metricConfigSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return saveMetricsSettings({
        userId: ctx.user.id,
        organizationId: org.id,
        dagId: input.dagId,
        selectedMetrics: input.selectedMetrics,
      });
    }),

  /**
   * Delete DAG-specific settings (revert to default).
   */
  deleteOverride: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        dagId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      await deleteMetricsSettings({
        userId: ctx.user.id,
        organizationId: org.id,
        dagId: input.dagId,
      });
      return { success: true };
    }),

  /**
   * Check if a DAG has custom settings override.
   */
  hasOverride: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        dagId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return hasDagOverride({
        userId: ctx.user.id,
        organizationId: org.id,
        dagId: input.dagId,
      });
    }),

  /**
   * Get all available metrics for a DAG (builtin + custom).
   */
  getAvailableMetrics: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        dagId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getAvailableMetrics({
        organizationId: org.id,
        dagId: input.dagId,
      });
    }),

  /**
   * Get built-in metrics list (for default settings page where no dagId is selected).
   */
  getBuiltinMetrics: protectedProcedure.query(async () => {
    return { builtinMetrics: BUILTIN_METRICS };
  }),

  /**
   * Get computed metrics for a DAG.
   */
  getComputedMetrics: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        dagId: z.string(),
        environment: z.string().optional().nullable(),
        timeframe: z.nativeEnum(Timeframe).default(Timeframe.Week),
      })
    )
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getComputedMetrics({
        organizationId: org.id,
        dagId: input.dagId,
        environment: input.environment,
        timeframe: input.timeframe,
      });
    }),
});
