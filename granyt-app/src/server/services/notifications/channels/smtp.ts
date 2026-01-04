/**
 * SMTP notification channel
 * 
 * Sends notifications via SMTP using nodemailer.
 */

import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { NotificationChannel } from "./base";
import {
  ChannelType,
  type SmtpChannelConfig,
  type SendResult,
  type TestResult,
  type RenderedNotification,
  type NotificationRecipient,
} from "../types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("SmtpChannel");

export class SmtpChannel extends NotificationChannel<SmtpChannelConfig> {
  readonly type = ChannelType.SMTP;
  readonly displayName = "SMTP Email";
  readonly description = "Send notifications via your own SMTP server";
  readonly envPrefix = "SMTP";

  async getConfig(organizationId: string): Promise<SmtpChannelConfig | null> {
    // Check new channel config table first
    const channelConfig = await prisma.organizationChannelConfig.findUnique({
      where: {
        organizationId_channelType: {
          organizationId,
          channelType: "SMTP",
        },
      },
    });

    if (channelConfig?.config) {
      const config = channelConfig.config as Record<string, unknown>;
      if (this.isValidConfig(config)) {
        return config as unknown as SmtpChannelConfig;
      }
    }

    // Fall back to environment variables
    return this.getEnvConfig();
  }

  getEnvConfig(): SmtpChannelConfig | null {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const fromEmail = process.env.SMTP_FROM_EMAIL;
    const fromName = process.env.SMTP_FROM_NAME;
    const secure = process.env.SMTP_SECURE;

    if (host && port && user && password && fromEmail) {
      return {
        host,
        port: parseInt(port, 10),
        user,
        password,
        secure: secure !== "false",
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
          channelType: "SMTP",
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
    config: SmtpChannelConfig
  ): Promise<SendResult> {
    const transporter = this.createTransporter(config);

    try {
      await transporter.sendMail({
        from: config.fromName
          ? `"${config.fromName}" <${config.fromEmail}>`
          : config.fromEmail,
        to: this.formatRecipients(recipients),
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error sending email";
      logger.error({ error: errorMessage, host: config.host }, "Failed to send email via SMTP");
      return { success: false, error: errorMessage };
    }
  }

  async testConnection(config: SmtpChannelConfig): Promise<TestResult> {
    const transporter = this.createTransporter(config);

    try {
      await transporter.verify();
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error testing SMTP";
      return { success: false, error: errorMessage };
    }
  }

  private createTransporter(config: SmtpChannelConfig) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  private formatRecipients(recipients: NotificationRecipient[]): string {
    return recipients
      .map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email))
      .join(", ");
  }

  private isValidConfig(config: Record<string, unknown>): boolean {
    return !!(
      config.host &&
      config.port &&
      config.user &&
      config.password &&
      config.fromEmail
    );
  }
}

export const smtpChannel = new SmtpChannel();
