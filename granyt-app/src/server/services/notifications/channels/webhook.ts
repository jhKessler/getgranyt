/**
 * Webhook notification channel
 * 
 * Sends notifications to a configured webhook endpoint.
 * Useful for custom integrations, Slack incoming webhooks, Discord, etc.
 */

import { prisma } from "@/lib/prisma";
import { NotificationChannel } from "./base";
import {
  ChannelType,
  type WebhookChannelConfig,
  type SendResult,
  type TestResult,
  type RenderedNotification,
  type NotificationRecipient,
} from "../types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("WebhookChannel");

export class WebhookChannel extends NotificationChannel<WebhookChannelConfig> {
  readonly type = ChannelType.WEBHOOK;
  readonly displayName = "Webhook";
  readonly description = "Send notifications to a custom webhook endpoint";
  readonly envPrefix = "WEBHOOK";

  async getConfig(organizationId: string): Promise<WebhookChannelConfig | null> {
    // Check channel config table first
    const channelConfig = await prisma.organizationChannelConfig.findUnique({
      where: {
        organizationId_channelType: {
          organizationId,
          channelType: "WEBHOOK",
        },
      },
    });

    if (channelConfig?.config) {
      const config = channelConfig.config as Record<string, unknown>;
      if (this.isValidConfig(config)) {
        return config as unknown as WebhookChannelConfig;
      }
    }

    // Fall back to environment variables
    return this.getEnvConfig();
  }

  getEnvConfig(): WebhookChannelConfig | null {
    const url = process.env.GRANYT_WEBHOOK_URL;
    const secret = process.env.GRANYT_WEBHOOK_SECRET;

    if (url) {
      return {
        url,
        secret: secret ?? undefined,
      };
    }

    return null;
  }

  async isEnabled(organizationId: string): Promise<boolean> {
    const channelConfig = await prisma.organizationChannelConfig.findUnique({
      where: {
        organizationId_channelType: {
          organizationId,
          channelType: "WEBHOOK",
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
    config: WebhookChannelConfig
  ): Promise<SendResult> {
    try {
      const payload = {
        event: "notification",
        type: notification.payload?.type ?? null,
        organizationId: notification.payload?.organizationId ?? null,
        severity: notification.payload?.severity ?? null,
        timestamp: new Date().toISOString(),
        subject: notification.subject,
        text: notification.text,
        html: notification.html,
        data: notification.payload ?? null,
        recipients: recipients.map((r) => ({
          email: r.email,
          name: r.name ?? null,
        })),
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Granyt-Webhook/1.0",
        ...config.headers,
      };

      // Add signature if secret is configured
      if (config.secret) {
        const signature = await this.generateSignature(
          JSON.stringify(payload),
          config.secret
        );
        headers["X-Granyt-Signature"] = signature;
      }

      this.validateUrl(config.url);

      const response = await fetch(config.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        logger.error(
          { status: response.status, errorText, url: config.url },
          "Failed to send webhook notification"
        );
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText.slice(0, 100)}`,
        };
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error sending webhook";
      logger.error({ error: errorMessage, url: config.url }, "Failed to send webhook notification");
      return { success: false, error: errorMessage };
    }
  }

  async testConnection(config: WebhookChannelConfig): Promise<TestResult> {
    try {
      // Validate URL format
      const url = new URL(config.url);
      if (!["http:", "https:"].includes(url.protocol)) {
        return { success: false, error: "URL must use http or https protocol" };
      }

      // Send a test ping
      const payload = {
        event: "test",
        timestamp: new Date().toISOString(),
        message: "Granyt webhook connection test",
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Granyt-Webhook/1.0",
        ...config.headers,
      };

      if (config.secret) {
        const signature = await this.generateSignature(
          JSON.stringify(payload),
          config.secret
        );
        headers["X-Granyt-Signature"] = signature;
      }

      this.validateUrl(config.url);

      const response = await fetch(config.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText.slice(0, 100)}`,
        };
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect to webhook";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Generate HMAC-SHA256 signature for webhook payload
   */
  private async generateSignature(
    payload: string,
    secret: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );

    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Validates that the URL is not an internal/private address to prevent SSRF.
   */
  private validateUrl(urlStr: string): void {
    try {
      const url = new URL(urlStr);
      const hostname = url.hostname.toLowerCase();

      // Block localhost and common internal IP ranges
      const isInternal =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname === "::1" ||
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("172.16.") ||
        hostname.startsWith("172.17.") ||
        hostname.startsWith("172.18.") ||
        hostname.startsWith("172.19.") ||
        hostname.startsWith("172.20.") ||
        hostname.startsWith("172.21.") ||
        hostname.startsWith("172.22.") ||
        hostname.startsWith("172.23.") ||
        hostname.startsWith("172.24.") ||
        hostname.startsWith("172.25.") ||
        hostname.startsWith("172.26.") ||
        hostname.startsWith("172.27.") ||
        hostname.startsWith("172.28.") ||
        hostname.startsWith("172.29.") ||
        hostname.startsWith("172.30.") ||
        hostname.startsWith("172.31.") ||
        hostname.endsWith(".local") ||
        hostname === "metadata.google.internal" ||
        hostname === "169.254.169.254";

      if (isInternal) {
        throw new Error("Internal URLs are not allowed");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Internal URLs are not allowed") {
        throw error;
      }
      throw new Error("Invalid URL format");
    }
  }

  private isValidConfig(config: Record<string, unknown>): boolean {
    return !!(config.url && typeof config.url === "string");
  }
}

export const webhookChannel = new WebhookChannel();
