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
      const result: Record<AlertType, { enabled: boolean; sensitivity: AlertSensitivity; customThreshold: number | null }> = {
        ROW_COUNT_DROP: { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null },
        NULL_OCCURRENCE: { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null },
        SCHEMA_CHANGE: { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null },
        INTEGRATION_ERROR: { enabled: true, sensitivity: AlertSensitivity.MEDIUM, customThreshold: null },
      };
      
      for (const setting of settings) {
        result[setting.alertType] = {
          enabled: setting.enabled,
          sensitivity: setting.sensitivity,
          customThreshold: setting.customThreshold,
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
        },
        update: {
          ...(input.enabled !== undefined && { enabled: input.enabled }),
          ...(input.sensitivity !== undefined && { sensitivity: input.sensitivity }),
          ...(input.sensitivity !== undefined && { 
            customThreshold: input.sensitivity === AlertSensitivity.CUSTOM ? input.customThreshold : null 
          }),
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
});
