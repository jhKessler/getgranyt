/**
 * Channel registry
 * 
 * Central registry of all available notification channels.
 * When adding a new channel, register it here.
 */

import { ChannelType } from "../types";
import type { NotificationChannel } from "./base";
import { smtpChannel } from "./smtp";
import { resendChannel } from "./resend";
import { webhookChannel } from "./webhook";

// Re-export channel implementations
export { NotificationChannel } from "./base";
export { SmtpChannel, smtpChannel } from "./smtp";
export { ResendChannel, resendChannel } from "./resend";
export { WebhookChannel, webhookChannel } from "./webhook";

/**
 * Map of all available channels
 */
const channels = new Map<ChannelType, NotificationChannel>([
  [ChannelType.SMTP, smtpChannel as NotificationChannel],
  [ChannelType.RESEND, resendChannel as NotificationChannel],
  [ChannelType.WEBHOOK, webhookChannel as NotificationChannel],
]);

/**
 * Get a specific channel by type
 */
export function getChannel(type: ChannelType): NotificationChannel | undefined {
  return channels.get(type);
}

/**
 * Get all registered channels
 */
export function getAllChannels(): NotificationChannel[] {
  return Array.from(channels.values());
}

/**
 * Get all channel types
 */
export function getAllChannelTypes(): ChannelType[] {
  return Array.from(channels.keys());
}

/**
 * Get all configured & enabled channels for an organization
 */
export async function getActiveChannels(
  organizationId: string
): Promise<NotificationChannel[]> {
  const active: NotificationChannel[] = [];

  for (const channel of channels.values()) {
    const [configured, enabled] = await Promise.all([
      channel.isConfigured(organizationId),
      channel.isEnabled(organizationId),
    ]);

    if (configured && enabled) {
      active.push(channel);
    }
  }

  // Prioritization logic: if both SMTP and RESEND are active, only use SMTP for email
  const hasSmtp = active.some((c) => c.type === ChannelType.SMTP);
  const hasResend = active.some((c) => c.type === ChannelType.RESEND);

  if (hasSmtp && hasResend) {
    return active.filter((c) => c.type !== ChannelType.RESEND);
  }

  return active;
}

/**
 * Get channel status for all channels for an organization
 */
export async function getChannelStatuses(
  organizationId: string
): Promise<Array<{
  type: ChannelType;
  displayName: string;
  description: string;
  isConfigured: boolean;
  isEnabled: boolean;
  hasEnvConfig: boolean;
}>> {
  const statuses = await Promise.all(
    Array.from(channels.values()).map(async (channel) => {
      const [isConfigured, isEnabled] = await Promise.all([
        channel.isConfigured(organizationId),
        channel.isEnabled(organizationId),
      ]);

      return {
        type: channel.type,
        displayName: channel.displayName,
        description: channel.description,
        isConfigured,
        isEnabled,
        hasEnvConfig: channel.getEnvConfig() !== null,
      };
    })
  );

  return statuses;
}
