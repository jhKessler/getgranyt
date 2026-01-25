import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { 
  getAlerts, 
  getAlertById, 
  countOpenAlerts, 
  getAlertsSummary 
} from "../services/alerts/queries/get-alerts";
import { 
  dismissAlert, 
  reopenAlert
} from "../services/alerts/mutations/alert-actions";
import { AlertStatus, AlertType, AlertSensitivity } from "@prisma/client";
import { getUserOrganization } from "../services/dashboard";

export const alertsRouter = router({
  /**
   * Get organization alert settings
   */
  getSettings: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      
      // Get settings for all alert types
      const settings = await ctx.prisma.organizationAlertSettings.findMany({
        where: { organizationId: org.id },
      });
      
      // Return settings map with defaults for missing types
      const result: Record<AlertType, { enabled: boolean; sensitivity: AlertSensitivity; customThreshold: number | null; enabledEnvironments: string[] }> = {
        ROW_COUNT_DROP: { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null, enabledEnvironments: [] },
        NULL_OCCURRENCE: { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null, enabledEnvironments: [] },
        SCHEMA_CHANGE: { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null, enabledEnvironments: [] },
        INTEGRATION_ERROR: { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null, enabledEnvironments: [] },
        CUSTOM_METRIC_DROP: { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null, enabledEnvironments: [] },
        CUSTOM_METRIC_DEGRADATION: { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null, enabledEnvironments: [] },
      };

      for (const setting of settings) {
        result[setting.alertType] = {
          enabled: setting.enabled,
          sensitivity: setting.sensitivity,
          customThreshold: setting.customThreshold,
          enabledEnvironments: setting.enabledEnvironments,
        };
      }
      
      return result;
    }),

  /**
   * Update organization alert settings
   */
  updateSettings: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      alertType: z.nativeEnum(AlertType),
      enabled: z.boolean().optional(),
      sensitivity: z.nativeEnum(AlertSensitivity).optional(),
      customThreshold: z.number().min(1).max(99).nullable().optional(),
      enabledEnvironments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      await ctx.prisma.organizationAlertSettings.upsert({
        where: {
          organizationId_alertType: {
            organizationId: org.id,
            alertType: input.alertType,
          },
        },
        create: {
          organizationId: org.id,
          alertType: input.alertType,
          enabled: input.enabled ?? true,
          sensitivity: input.sensitivity ?? AlertSensitivity.MEDIUM,
          customThreshold: input.sensitivity === AlertSensitivity.CUSTOM ? input.customThreshold : null,
          enabledEnvironments: input.enabledEnvironments ?? [],
        },
        update: {
          ...(input.enabled !== undefined && { enabled: input.enabled }),
          ...(input.sensitivity !== undefined && { sensitivity: input.sensitivity }),
          ...(input.sensitivity !== undefined && {
            customThreshold: input.sensitivity === AlertSensitivity.CUSTOM ? input.customThreshold : null,
          }),
          ...(input.enabledEnvironments !== undefined && { enabledEnvironments: input.enabledEnvironments }),
        },
      });

      return { success: true };
    }),

  /**
   * Get alerts for the current organization
   */
  getAlerts: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      status: z.enum(["OPEN", "ACKNOWLEDGED", "DISMISSED", "AUTO_RESOLVED"]).optional(),
      alertType: z.nativeEnum(AlertType).optional(),
      srcDagId: z.string().optional(),
      dagRunId: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const status = input.status ? AlertStatus[input.status] : undefined;
      return getAlerts({
        organizationId: org.id,
        status,
        alertType: input.alertType,
        srcDagId: input.srcDagId,
        dagRunId: input.dagRunId,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  /**
   * Get a single alert by ID
   */
  getAlert: protectedProcedure
    .input(z.object({ 
      organizationId: z.string().optional(),
      alertId: z.string() 
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getAlertById(input.alertId, org.id);
    }),

  /**
   * Get count of open alerts
   */
  getOpenAlertCount: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return countOpenAlerts(org.id);
    }),

  /**
   * Get alerts summary (critical/warning counts)
   */
  getAlertsSummary: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getAlertsSummary(org.id);
    }),

  /**
   * Get DAG IDs that have open alerts (for UI indicators)
   */
  getDagsWithAlerts: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const alerts = await ctx.prisma.alert.findMany({
        where: {
          organizationId: org.id,
          status: AlertStatus.OPEN,
        },
        select: {
          srcDagId: true,
          severity: true,
          alertType: true,
          id: true,
        },
      });

      // Group by srcDagId
      const dagAlerts = new Map<string, { count: number; hasCritical: boolean; alertId: string }>();
      for (const alert of alerts) {
        const dagId = alert.srcDagId ?? "system";
        const existing = dagAlerts.get(dagId);
        if (existing) {
          existing.count++;
          if (alert.severity === "critical") existing.hasCritical = true;
        } else {
          dagAlerts.set(dagId, {
            count: 1,
            hasCritical: alert.severity === "critical",
            alertId: alert.id,
          });
        }
      }

      return Object.fromEntries(dagAlerts);
    }),

  /**
   * Get dag run IDs that have open alerts (for UI indicators)
   */
  getDagRunsWithAlerts: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const alerts = await ctx.prisma.alert.findMany({
        where: {
          organizationId: org.id,
          status: AlertStatus.OPEN,
        },
        select: {
          dagRunId: true,
          severity: true,
          alertType: true,
          id: true,
        },
      });

      // Group by dagRunId
      const runAlerts = new Map<string, { count: number; hasCritical: boolean; alertId: string }>();
      for (const alert of alerts) {
        const runId = alert.dagRunId ?? "n/a";
        const existing = runAlerts.get(runId);
        if (existing) {
          existing.count++;
          if (alert.severity === "critical") existing.hasCritical = true;
        } else {
          runAlerts.set(runId, {
            count: 1,
            hasCritical: alert.severity === "critical",
            alertId: alert.id,
          });
        }
      }

      return Object.fromEntries(runAlerts);
    }),

  /**
   * Get DAG-specific alert settings
   */
  getDagSettings: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      srcDagId: z.string(),
      captureId: z.string().nullable(),
      alertType: z.nativeEnum(AlertType),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const settings = await ctx.prisma.dagAlertSettings.findUnique({
        where: {
          organizationId_srcDagId_captureId_alertType: {
            organizationId: org.id,
            srcDagId: input.srcDagId,
            captureId: input.captureId ?? "",
            alertType: input.alertType,
          },
        },
      });
      return settings;
    }),

  /**
   * Set DAG sensitivity (used when marking as "expected behavior")
   */
  setDagSensitivity: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      alertId: z.string(),
      sensitivity: z.nativeEnum(AlertSensitivity),
      customThreshold: z.number().min(1).max(99).nullable().optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      
      // Get alert to extract DAG info
      const alert = await ctx.prisma.alert.findUnique({
        where: { id: input.alertId },
      });
      
      if (!alert || alert.organizationId !== org.id) {
        throw new Error("Alert not found");
      }

      if (!alert.srcDagId) {
        throw new Error("Cannot set sensitivity for system alerts");
      }

      // Import and call setDagSensitivity
      const { setDagSensitivity } = await import("../services/alerts/engine/get-effective-settings");
      await setDagSensitivity(
        org.id,
        alert.srcDagId,
        alert.captureId,
        alert.alertType,
        input.sensitivity,
        input.customThreshold,
        input.enabled
      );

      // Dismiss the alert
      await dismissAlert(input.alertId, ctx.user.id, "expected_behavior");
      
      return { success: true };
    }),

  /**
   * Dismiss an alert (for temporary issues, resolved, false positives)
   */
  dismiss: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      alertId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const alert = await ctx.prisma.alert.findFirst({
        where: { id: input.alertId, organizationId: org.id },
      });
      if (!alert) {
        throw new Error("Alert not found");
      }
      await dismissAlert(input.alertId, ctx.user.id, "other");
      return { success: true };
    }),

  /**
   * Reopen an alert
   */
  reopen: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      alertId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      const alert = await ctx.prisma.alert.findFirst({
        where: { id: input.alertId, organizationId: org.id },
      });
      if (!alert) {
        throw new Error("Alert not found");
      }
      await reopenAlert(input.alertId);
      return { success: true };
    }),

  // ============================================================================
  // Custom Metric Monitors
  // ============================================================================

  /**
   * Get all custom metric monitors for the organization
   */
  getMetricMonitors: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      const monitors = await ctx.prisma.customMetricMonitor.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: "desc" },
      });

      return monitors;
    }),

  /**
   * Create a new custom metric monitor
   */
  createMetricMonitor: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      name: z.string().min(1).max(100),
      srcDagId: z.string(),
      metricName: z.string().min(1),
      alertType: z.enum(["CUSTOM_METRIC_DROP", "CUSTOM_METRIC_DEGRADATION"]),
      // Sharp drop settings
      sensitivity: z.nativeEnum(AlertSensitivity).optional().default(AlertSensitivity.MEDIUM),
      customThreshold: z.number().min(1).max(99).nullable().optional(),
      // Slow degradation settings
      windowDays: z.number().min(1).max(90).optional().default(14),
      minDeclinePercent: z.number().min(1).max(100).optional().default(15),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      // Check if monitor already exists for this DAG + metric combination
      const existing = await ctx.prisma.customMetricMonitor.findUnique({
        where: {
          organizationId_srcDagId_metricName: {
            organizationId: org.id,
            srcDagId: input.srcDagId,
            metricName: input.metricName,
          },
        },
      });

      if (existing) {
        throw new Error(`A monitor already exists for metric "${input.metricName}" on DAG "${input.srcDagId}"`);
      }

      const monitor = await ctx.prisma.customMetricMonitor.create({
        data: {
          organizationId: org.id,
          name: input.name,
          srcDagId: input.srcDagId,
          metricName: input.metricName,
          alertType: AlertType[input.alertType],
          sensitivity: input.sensitivity,
          customThreshold: input.sensitivity === AlertSensitivity.CUSTOM ? input.customThreshold : null,
          windowDays: input.windowDays,
          minDeclinePercent: input.minDeclinePercent,
        },
      });

      return monitor;
    }),

  /**
   * Update an existing custom metric monitor
   */
  updateMetricMonitor: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      alertType: z.enum(["CUSTOM_METRIC_DROP", "CUSTOM_METRIC_DEGRADATION"]).optional(),
      sensitivity: z.nativeEnum(AlertSensitivity).optional(),
      customThreshold: z.number().min(1).max(99).nullable().optional(),
      windowDays: z.number().min(1).max(90).optional(),
      minDeclinePercent: z.number().min(1).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      // Verify monitor exists and belongs to org
      const existing = await ctx.prisma.customMetricMonitor.findFirst({
        where: { id: input.id, organizationId: org.id },
      });

      if (!existing) {
        throw new Error("Monitor not found");
      }

      const monitor = await ctx.prisma.customMetricMonitor.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.alertType !== undefined && { alertType: AlertType[input.alertType] }),
          ...(input.sensitivity !== undefined && { sensitivity: input.sensitivity }),
          ...(input.sensitivity !== undefined && {
            customThreshold: input.sensitivity === AlertSensitivity.CUSTOM ? input.customThreshold : null,
          }),
          ...(input.windowDays !== undefined && { windowDays: input.windowDays }),
          ...(input.minDeclinePercent !== undefined && { minDeclinePercent: input.minDeclinePercent }),
        },
      });

      return monitor;
    }),

  /**
   * Delete a custom metric monitor
   */
  deleteMetricMonitor: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      // Verify monitor exists and belongs to org
      const existing = await ctx.prisma.customMetricMonitor.findFirst({
        where: { id: input.id, organizationId: org.id },
      });

      if (!existing) {
        throw new Error("Monitor not found");
      }

      await ctx.prisma.customMetricMonitor.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Toggle a custom metric monitor's enabled state
   */
  toggleMetricMonitor: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      id: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      // Verify monitor exists and belongs to org
      const existing = await ctx.prisma.customMetricMonitor.findFirst({
        where: { id: input.id, organizationId: org.id },
      });

      if (!existing) {
        throw new Error("Monitor not found");
      }

      const monitor = await ctx.prisma.customMetricMonitor.update({
        where: { id: input.id },
        data: { enabled: input.enabled },
      });

      return monitor;
    }),

  /**
   * Get available custom metrics for a DAG
   * Returns metrics that have been captured in the Metric.metrics JSON field
   */
  getAvailableCustomMetrics: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      srcDagId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      // Get recent metrics for this DAG to extract available custom metric keys
      const recentMetrics = await ctx.prisma.metric.findMany({
        where: {
          organizationId: org.id,
          taskRun: {
            dagRun: {
              srcDagId: input.srcDagId,
            },
          },
        },
        select: {
          metrics: true,
          taskRun: {
            select: {
              srcTaskId: true,
            },
          },
        },
        take: 100,
        orderBy: { capturedAt: "desc" },
      });

      // Extract unique metric keys (excluding standard DataFrame metrics)
      const standardKeys = new Set([
        "row_count", "column_count", "dataframe_type", "memory_bytes", "upstream",
        "_is_custom_metric", // Internal flag
      ]);

      const metricKeys = new Map<string, { taskId: string | null; sampleValue: number }>();

      for (const metric of recentMetrics) {
        const metricsObj = metric.metrics as Record<string, unknown> | null;
        if (!metricsObj || typeof metricsObj !== "object") continue;

        for (const [key, value] of Object.entries(metricsObj)) {
          if (standardKeys.has(key)) continue;
          if (typeof value !== "number") continue;
          if (metricKeys.has(key)) continue;

          metricKeys.set(key, {
            taskId: metric.taskRun?.srcTaskId ?? null,
            sampleValue: value,
          });
        }
      }

      return Array.from(metricKeys.entries()).map(([name, info]) => ({
        name,
        taskId: info.taskId,
        sampleValue: info.sampleValue,
      }));
    }),
});
