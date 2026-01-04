/**
 * Resend notification channel
 * 
 * Sends notifications via Resend API.
 * https://resend.com
 */

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { NotificationChannel } from "./base";
import {
  ChannelType,
  type ResendChannelConfig,
  type SendResult,
  type TestResult,
  type RenderedNotification,
  type NotificationRecipient,
} from "../types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ResendChannel");

export class ResendChannel extends NotificationChannel<ResendChannelConfig> {
  readonly type = ChannelType.RESEND;
  readonly displayName = "Resend";
  readonly description = "Send notifications via Resend email API";
  readonly envPrefix = "RESEND";

  async getConfig(organizationId: string): Promise<ResendChannelConfig | null> {
    // Check channel config table first
    const channelConfig = await prisma.organizationChannelConfig.findUnique({
      where: {
        organizationId_channelType: {
          organizationId,
          channelType: "RESEND",
        },
      },
    });

    if (channelConfig?.config) {
      const config = channelConfig.config as Record<string, unknown>;
      if (this.isValidConfig(config)) {
        return config as unknown as ResendChannelConfig;
      }
    }

    // Fall back to environment variables
    return this.getEnvConfig();
  }

  getEnvConfig(): ResendChannelConfig | null {
    const apiKey = process.env.GRANYT_RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const fromName = process.env.RESEND_FROM_NAME;

    if (apiKey && fromEmail) {
      return {
        apiKey,
        fromEmail,
        fromName: fromName ?? undefined,
      };
    }

    return null;
  }

  async isEnabled(organizationId: string): Promise<boolean> {
    const channelConfig = await prisma.organizationChannelConfig.findUnique({
      where: {
        organizationId_channelType: {
          organizationId,
          channelType: "RESEND",
        },
      },
    });

    // If explicit config exists, use its enabled state
    if (channelConfig) {
      return channelConfig.enabled;
    }

    // If using env vars, consider it enabled by default
    const envConfig = this.getEnvConfig();
    return envConfig !== null;
  }

  async send(
    notification: RenderedNotification,
    recipients: NotificationRecipient[],
    config: ResendChannelConfig
  ): Promise<SendResult> {
    const resend = new Resend(config.apiKey);

    try {
      const fromAddress = config.fromName
        ? `${config.fromName} <${config.fromEmail}>`
        : config.fromEmail;

      const result = await resend.emails.send({
        from: fromAddress,
        to: recipients.map((r) => r.email),
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
      });

      if (result.error) {
        logger.error({ error: result.error }, "Failed to send email via Resend");
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error sending email";
      logger.error({ error: errorMessage }, "Failed to send email via Resend");
      return { success: false, error: errorMessage };
    }
  }

  async testConnection(config: ResendChannelConfig): Promise<TestResult> {
    // Resend doesn't have a dedicated "verify" endpoint
    // We validate the API key format and make a domains list call
    if (!config.apiKey.startsWith("re_")) {
      return { success: false, error: "Invalid Resend API key format (should start with 're_')" };
    }

    const resend = new Resend(config.apiKey);

    try {
      // Try to list domains - this will fail if the API key is invalid
      const result = await resend.domains.list();
      
      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to verify API key";
      return { success: false, error: errorMessage };
    }
  }

  private isValidConfig(config: Record<string, unknown>): boolean {
    return !!(config.apiKey && config.fromEmail);
  }
}

export const resendChannel = new ResendChannel();
