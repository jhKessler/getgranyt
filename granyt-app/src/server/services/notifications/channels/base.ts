/**
 * Base notification channel interface
 * 
 * All channel implementations (SMTP, Resend, Webhook, etc.) must implement this interface.
 * This ensures consistent behavior across all notification channels.
 */

import type {
  ChannelType,
  ChannelConfig,
  SendResult,
  TestResult,
  RenderedNotification,
  NotificationRecipient,
} from "../types";

/**
 * Abstract base class for notification channels.
 * Each integration (SMTP, Resend, Webhook, Slack) implements this.
 */
export abstract class NotificationChannel<TConfig extends ChannelConfig = ChannelConfig> {
  /** The channel type identifier */
  abstract readonly type: ChannelType;
  
  /** Display name for UI */
  abstract readonly displayName: string;
  
  /** Description for UI */
  abstract readonly description: string;
  
  /** Environment variable prefix for this channel */
  abstract readonly envPrefix: string;

  /**
   * Get channel config for an organization.
   * Checks DB first, then falls back to env vars.
   */
  abstract getConfig(organizationId: string): Promise<TConfig | null>;

  /**
   * Get config from environment variables only.
   * Returns null if required env vars are not set.
   */
  abstract getEnvConfig(): TConfig | null;

  /**
   * Check if this channel is properly configured (has required fields).
   */
  async isConfigured(organizationId: string): Promise<boolean> {
    const config = await this.getConfig(organizationId);
    return config !== null;
  }

  /**
   * Check if this channel is enabled for the organization.
   * A channel can be configured but disabled by the user.
   */
  abstract isEnabled(organizationId: string): Promise<boolean>;

  /**
   * Send a notification through this channel.
   * @param notification - The rendered notification content
   * @param recipients - List of recipients
   * @param config - The channel configuration
   */
  abstract send(
    notification: RenderedNotification,
    recipients: NotificationRecipient[],
    config: TConfig
  ): Promise<SendResult>;

  /**
   * Test the channel connection/configuration.
   */
  abstract testConnection(config: TConfig): Promise<TestResult>;

  /**
   * Send a test notification to verify setup.
   */
  async sendTest(
    config: TConfig,
    testRecipient: string
  ): Promise<SendResult> {
    return this.send(
      {
        subject: `Granyt - ${this.displayName} Test`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">🛡️ Granyt ${this.displayName} Test</h2>
            <p>This is a test notification to verify your ${this.displayName} configuration is working correctly.</p>
            <p>If you received this, your settings are configured properly!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              This notification was sent from Granyt to test your notification settings.
            </p>
          </div>
        `,
        text: `Granyt ${this.displayName} Test\n\nThis is a test notification to verify your ${this.displayName} configuration is working correctly.\n\nIf you received this, your settings are configured properly!`,
      },
      [{ email: testRecipient }],
      config
    );
  }
}
