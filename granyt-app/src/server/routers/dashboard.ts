import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  getUserOrganization,
  getStartDate,
  getDefaultEnvironment,
  getOverviewMetrics,
  getHourlyRunStats,
  getTimeframeRunStats,
  getRecentErrors,
  getErrorsByEnvironmentType,
  getErrorDetails,
  updateErrorStatus,
  getDagsOverview,
  getDagDetails,
  getDagEnvironmentStatuses,
  getDagRunsWithMetrics,
  getAllDagRuns,
  getMetricsTimeline,
  getRunMetrics,
  getSchemaEvolution,
  getRunDetails,
} from "../services/dashboard";
import {
  getDagRunMetricSnapshots,
  getAvailableMetricsForDag,
} from "../services/dag-metrics";
import { 
  ErrorStatus, 
  Timeframe, 
  RunStatusFilter, 
  RunType, 
  EnvironmentType 
} from "../services/dashboard/types";

export const dashboardRouter = router({
  getDefaultEnvironment: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getDefaultEnvironment(ctx.prisma, org.id);
    }),

  getOverviewMetrics: protectedProcedure
    .input(z.object({ 
      organizationId: z.string().optional(),
      timeframe: z.nativeEnum(Timeframe).default(Timeframe.Day),
      environment: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const startDate = getStartDate(input.timeframe);
      return getOverviewMetrics(ctx.prisma, org.id, startDate, input.environment);
    }),

  getHourlyRunStats: protectedProcedure
    .input(z.object({ 
      organizationId: z.string().optional(),
      hours: z.number().default(24),
      environment: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getHourlyRunStats(ctx.prisma, org.id, input.hours, input.environment);
    }),

  getRunStats: protectedProcedure
    .input(z.object({ 
      organizationId: z.string().optional(),
      timeframe: z.nativeEnum(Timeframe).default(Timeframe.Day),
      environment: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getTimeframeRunStats(ctx.prisma, org.id, input.timeframe, input.environment);
    }),

  getRecentErrors: protectedProcedure
    .input(z.object({ 
      organizationId: z.string().optional(),
      limit: z.number().default(10),
      environment: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getRecentErrors(ctx.prisma, org.id, input.limit, input.environment);
    }),

  getErrorsByEnvironmentType: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      type: z.nativeEnum(EnvironmentType),
      limit: z.number().default(10),
      defaultEnvironmentName: z.string().optional(),
      nonDefaultEnvironmentNames: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getErrorsByEnvironmentType(
        ctx.prisma, 
        org.id, 
        input.type, 
        input.limit,
        input.defaultEnvironmentName,
        input.nonDefaultEnvironmentNames
      );
    }),

  getErrorDetails: protectedProcedure
    .input(z.object({ 
      organizationId: z.string().optional(),
      errorId: z.string() 
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getErrorDetails(ctx.prisma, org.id, input.errorId);
    }),

  updateErrorStatus: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      errorId: z.string(),
      status: z.nativeEnum(ErrorStatus),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return updateErrorStatus(ctx.prisma, org.id, input.errorId, input.status);
    }),

  getDagsOverview: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      timeframe: z.nativeEnum(Timeframe).default(Timeframe.Day),
      search: z.string().optional(),
      status: z.nativeEnum(RunStatusFilter).optional(),
      environment: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const startDate = getStartDate(input.timeframe);
      return getDagsOverview(
        ctx.prisma, 
        org.id, 
        startDate, 
        input.search, 
        input.status,
        input.environment
      );
    }),

  getDagDetails: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      dagId: z.string(),
      timeframe: z.nativeEnum(Timeframe).default(Timeframe.Week),
      environment: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const startDate = getStartDate(input.timeframe);
      return getDagDetails(ctx.prisma, org.id, input.dagId, startDate, input.environment);
    }),

  getDagEnvironmentStatuses: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      dagId: z.string(),
      timeframe: z.nativeEnum(Timeframe).default(Timeframe.Week),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const startDate = getStartDate(input.timeframe);
      return getDagEnvironmentStatuses(ctx.prisma, org.id, input.dagId, startDate);
    }),

  getDagRuns: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      dagId: z.string(),
      timeframe: z.nativeEnum(Timeframe).default(Timeframe.Week),
      limit: z.number().default(50),
      environment: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const startDate = getStartDate(input.timeframe);
      return getDagRunsWithMetrics(
        ctx.prisma, 
        org.id, 
        input.dagId, 
        startDate, 
        input.limit,
        input.environment
      );
    }),

  getMetricsTimeline: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      dagId: z.string(),
      timeframe: z.nativeEnum(Timeframe).default(Timeframe.Week),
      environment: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const startDate = getStartDate(input.timeframe);
      return getMetricsTimeline(
        ctx.prisma,
        org.id,
        input.dagId,
        startDate,
        input.environment,
        input.limit
      );
    }),

  getRunMetrics: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      runId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getRunMetrics(ctx.prisma, org.id, input.runId);
    }),

  getSchemaEvolution: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      dagId: z.string(),
      timeframe: z.nativeEnum(Timeframe).default(Timeframe.Week),
      environment: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const startDate = getStartDate(input.timeframe);
      return getSchemaEvolution(
        ctx.prisma,
        org.id,
        input.dagId,
        startDate,
        input.environment,
        input.limit
      );
    }),

  getRunDetails: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      runId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getRunDetails(ctx.prisma, org.id, input.runId);
    }),

  getAllDagRuns: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      timeframe: z.nativeEnum(Timeframe).default(Timeframe.Day),
      search: z.string().optional(),
      status: z.nativeEnum(RunStatusFilter).optional(),
      runType: z.nativeEnum(RunType).optional(),
      environment: z.string().optional(),
      limit: z.number().default(100),
      // Custom date range (overrides timeframe when both are provided)
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      // Use custom date range if provided, otherwise use timeframe
      const startDate = input.startTime ? new Date(input.startTime) : getStartDate(input.timeframe);
      const endDate = input.endTime ? new Date(input.endTime) : null;
      return getAllDagRuns(
        ctx.prisma,
        org.id,
        startDate,
        endDate,
        input.limit,
        input.search,
        input.status,
        input.runType,
        input.environment
      );
    }),

  // Get metric snapshots for runs (for the run history chart with metric selector)
  getRunMetricSnapshots: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      dagId: z.string(),
      timeframe: z.nativeEnum(Timeframe).default(Timeframe.Week),
      environment: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const startDate = getStartDate(input.timeframe);
      return getDagRunMetricSnapshots({
        organizationId: org.id,
        srcDagId: input.dagId,
        environment: input.environment,
        startDate,
        limit: input.limit,
      });
    }),

  // Get available metrics for the metric selector dropdown
  getAvailableRunMetrics: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      dagId: z.string(),
      environment: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getAvailableMetricsForDag({
        organizationId: org.id,
        srcDagId: input.dagId,
        environment: input.environment,
      });
    }),
});
