import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getUserOrganization } from "../services/dashboard";
import { getNotificationDefaults, NotificationTypes, type NotificationTypeValue } from "@/lib/notifications";
import {
  getChannelStatuses,
  getChannel,
  ChannelType,
} from "../services/notifications";
import { env } from "@/env";

/**
 * Check if SMTP is configured via environment variables
 */
function isSmtpEnvConfigured(): boolean {
  return !!(
    env.SMTP_HOST &&
    env.SMTP_PORT &&
    env.SMTP_USER &&
    env.SMTP_PASSWORD &&
    env.SMTP_FROM_EMAIL
  );
}

/**
 * Check if Resend is configured via environment variables
 */
function isResendEnvConfigured(): boolean {
  return !!(env.GRANYT_RESEND_API_KEY && env.RESEND_FROM_EMAIL);
}

export const settingsRouter = router({
  /**
   * Check if email is configured via environment variables
   * Used during onboarding to nudge users to set up email
   */
  getEmailEnvStatus: protectedProcedure.query(() => {
    const smtpConfigured = isSmtpEnvConfigured();
    const resendConfigured = isResendEnvConfigured();
    
    return {
      isEmailConfigured: smtpConfigured || resendConfigured,
      smtp: smtpConfigured,
      resend: resendConfigured,
    };
  }),

  /**
   * Get notification settings
   */
  getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.userNotificationSettings.findMany({
      where: { userId: ctx.user.id },
    });

    // Build result with defaults from centralized config
    const result: Record<NotificationTypeValue, boolean> = getNotificationDefaults();

    for (const setting of settings) {
      result[setting.notificationType as NotificationTypeValue] = setting.enabled;
    }

    return result;
  }),

  /**
   * Update notification setting
   */
  updateNotificationSetting: protectedProcedure
    .input(
      z.object({
        notificationType: z.enum([
          NotificationTypes.ALL_ALERTS,
          NotificationTypes.NULL_OCCURRENCE_ALERT,
          NotificationTypes.SCHEMA_CHANGE_ALERT,
          NotificationTypes.ROW_COUNT_DROP_ALERT,
          NotificationTypes.ALL_ERRORS,
          NotificationTypes.NEW_ERRORS_ONLY,
        ]),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.userNotificationSettings.upsert({
        where: {
          userId_notificationType: {
            userId: ctx.user.id,
            notificationType: input.notificationType,
          },
        },
        create: {
          userId: ctx.user.id,
          notificationType: input.notificationType,
          enabled: input.enabled,
        },
        update: {
          enabled: input.enabled,
        },
      });

      return { success: true };
    }),

  /**
   * Update multiple notification settings at once
   */
  updateNotificationSettings: protectedProcedure
    .input(
      z.array(
        z.object({
          notificationType: z.enum([
            NotificationTypes.ALL_ALERTS,
            NotificationTypes.NULL_OCCURRENCE_ALERT,
            NotificationTypes.SCHEMA_CHANGE_ALERT,
            NotificationTypes.ROW_COUNT_DROP_ALERT,
            NotificationTypes.ALL_ERRORS,
            NotificationTypes.NEW_ERRORS_ONLY,
          ]),
          enabled: z.boolean(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      // Use a transaction to update all settings
      await ctx.prisma.$transaction(
        input.map((update) =>
          ctx.prisma.userNotificationSettings.upsert({
            where: {
              userId_notificationType: {
                userId: ctx.user.id,
                notificationType: update.notificationType,
              },
            },
            create: {
              userId: ctx.user.id,
              notificationType: update.notificationType,
              enabled: update.enabled,
            },
            update: {
              enabled: update.enabled,
            },
          })
        )
      );

      return { success: true };
    }),

  // ============================================================================
  // NOTIFICATION FILTERS (environment and run type filters)
  // ============================================================================

  /**
   * Get notification filter settings for the current user
   */
  getNotificationFilters: protectedProcedure.query(async ({ ctx }) => {
    const filters = await ctx.prisma.userNotificationFilters.findUnique({
      where: { userId: ctx.user.id },
    });

    // Return with defaults if no filters set
    return {
      environmentFilter: (filters?.environmentFilter ?? "all") as "all" | "default_only",
      includeManualRuns: filters?.includeManualRuns ?? true,
    };
  }),

  /**
   * Update notification filter settings for the current user
   */
  updateNotificationFilters: protectedProcedure
    .input(
      z.object({
        environmentFilter: z.enum(["all", "default_only"]).optional(),
        includeManualRuns: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.userNotificationFilters.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          environmentFilter: input.environmentFilter ?? "all",
          includeManualRuns: input.includeManualRuns ?? true,
        },
        update: {
          ...(input.environmentFilter !== undefined && { environmentFilter: input.environmentFilter }),
          ...(input.includeManualRuns !== undefined && { includeManualRuns: input.includeManualRuns }),
        },
      });

      return { success: true };
    }),

  // ============================================================================
  // CHANNEL MANAGEMENT
  // ============================================================================

  /**
   * Get all channel statuses for the organization
   */
  getChannelStatuses: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);
      return getChannelStatuses(org.id);
    }),

  /**
   * Get channel config for a specific channel
   */
  getChannelConfig: protectedProcedure
    .input(z.object({ 
      organizationId: z.string().optional(),
      channelType: z.enum(["SMTP", "RESEND", "WEBHOOK"]) 
    }))
    .query(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      const config = await ctx.prisma.organizationChannelConfig.findUnique({
        where: {
          organizationId_channelType: {
            organizationId: org.id,
            channelType: input.channelType,
          },
        },
      });

      // Get channel to check for env config
      const channel = getChannel(input.channelType as ChannelType);
      const envConfig = channel?.getEnvConfig();

      return {
        channelType: input.channelType,
        enabled: config?.enabled ?? (envConfig !== null),
        config: config?.config ?? null,
        hasEnvConfig: envConfig !== null,
        lastTestAt: config?.lastTestAt ?? null,
        lastTestSuccess: config?.lastTestSuccess ?? null,
        lastTestError: config?.lastTestError ?? null,
      };
    }),

  /**
   * Save channel config
   */
  saveChannelConfig: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        channelType: z.enum(["SMTP", "RESEND", "WEBHOOK"]),
        enabled: z.boolean(),
        config: z.record(z.unknown()).nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      // If enabling an email channel, disable the other email channel to ensure mutual exclusivity
      if (input.enabled && (input.channelType === "SMTP" || input.channelType === "RESEND")) {
        const otherEmailType = input.channelType === "SMTP" ? "RESEND" : "SMTP";
        await ctx.prisma.organizationChannelConfig.updateMany({
          where: {
            organizationId: org.id,
            channelType: otherEmailType,
          },
          data: { enabled: false },
        });
      }

      await ctx.prisma.organizationChannelConfig.upsert({
        where: {
          organizationId_channelType: {
            organizationId: org.id,
            channelType: input.channelType,
          },
        },
        create: {
          organizationId: org.id,
          channelType: input.channelType,
          enabled: input.enabled,
          config: input.config as object ?? undefined,
        },
        update: {
          enabled: input.enabled,
          config: input.config as object ?? undefined,
        },
      });

      return { success: true };
    }),

  /**
   * Toggle channel enabled state
   */
  toggleChannel: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        channelType: z.enum(["SMTP", "RESEND", "WEBHOOK"]),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      // If enabling an email channel, disable the other email channel to ensure mutual exclusivity
      if (input.enabled && (input.channelType === "SMTP" || input.channelType === "RESEND")) {
        const otherEmailType = input.channelType === "SMTP" ? "RESEND" : "SMTP";
        await ctx.prisma.organizationChannelConfig.updateMany({
          where: {
            organizationId: org.id,
            channelType: otherEmailType,
          },
          data: { enabled: false },
        });
      }

      await ctx.prisma.organizationChannelConfig.upsert({
        where: {
          organizationId_channelType: {
            organizationId: org.id,
            channelType: input.channelType,
          },
        },
        create: {
          organizationId: org.id,
          channelType: input.channelType,
          enabled: input.enabled,
        },
        update: {
          enabled: input.enabled,
        },
      });

      return { success: true };
    }),

  /**
   * Test a channel connection
   */
  testChannelConnection: protectedProcedure
    .input(z.object({ 
      organizationId: z.string().optional(),
      channelType: z.enum(["SMTP", "RESEND", "WEBHOOK"]) 
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      const channel = getChannel(input.channelType as ChannelType);
      if (!channel) {
        return { success: false, error: "Unknown channel type" };
      }

      const config = await channel.getConfig(org.id);
      if (!config) {
        return { success: false, error: `${channel.displayName} not configured` };
      }

      const result = await channel.testConnection(config);

      // Update last test result
      await ctx.prisma.organizationChannelConfig.upsert({
        where: {
          organizationId_channelType: {
            organizationId: org.id,
            channelType: input.channelType,
          },
        },
        create: {
          organizationId: org.id,
          channelType: input.channelType,
          lastTestAt: new Date(),
          lastTestSuccess: result.success,
          lastTestError: result.error ?? null,
        },
        update: {
          lastTestAt: new Date(),
          lastTestSuccess: result.success,
          lastTestError: result.error ?? null,
        },
      });

      return result;
    }),

  /**
   * Send a test notification through a specific channel
   */
  sendTestNotification: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        channelType: z.enum(["SMTP", "RESEND", "WEBHOOK"]),
        testRecipient: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      const channel = getChannel(input.channelType as ChannelType);
      if (!channel) {
        return { success: false, error: "Unknown channel type" };
      }

      const config = await channel.getConfig(org.id);
      if (!config) {
        return { success: false, error: `${channel.displayName} not configured` };
      }

      const result = await channel.sendTest(config, input.testRecipient);

      // Update last test result
      await ctx.prisma.organizationChannelConfig.upsert({
        where: {
          organizationId_channelType: {
            organizationId: org.id,
            channelType: input.channelType,
          },
        },
        create: {
          organizationId: org.id,
          channelType: input.channelType,
          lastTestAt: new Date(),
          lastTestSuccess: result.success,
          lastTestError: result.error ?? null,
        },
        update: {
          lastTestAt: new Date(),
          lastTestSuccess: result.success,
          lastTestError: result.error ?? null,
        },
      });

      return result;
    }),

  /**
   * Clear channel config (use env vars instead)
   */
  clearChannelConfig: protectedProcedure
    .input(z.object({ 
      organizationId: z.string().optional(),
      channelType: z.enum(["SMTP", "RESEND", "WEBHOOK"]) 
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getUserOrganization(ctx.prisma, ctx.user.id, input.organizationId);

      await ctx.prisma.organizationChannelConfig.deleteMany({
        where: {
          organizationId: org.id,
          channelType: input.channelType,
        },
      });

      return { success: true };
    }),
});
