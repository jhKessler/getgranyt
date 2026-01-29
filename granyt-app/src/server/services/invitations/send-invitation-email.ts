import { prisma } from "@/lib/prisma";
import { smtpChannel } from "../notifications/channels/smtp";
import { resendChannel } from "../notifications/channels/resend";
import { createLogger } from "@/lib/logger";

const logger = createLogger("InvitationEmail");

interface SendInvitationEmailParams {
  recipientEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
  expiresInDays: number;
}

/**
 * Sends an invitation email using the configured email channel.
 * Tries SMTP first, then Resend, using environment or database config.
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<void> {
  const {
    recipientEmail,
    inviterName,
    organizationName,
    role,
    inviteUrl,
    expiresInDays,
  } = params;

  // Get organization ID from the first org (invitations are org-scoped)
  const org = await prisma.organization.findFirst({
    select: { id: true },
  });

  if (!org) {
    logger.warn("No organization found, cannot send invitation email");
    return;
  }

  const organizationId = org.id;

  // Generate email content
  const subject = `You've been invited to join ${organizationName}`;
  const { html, text } = generateInvitationEmailContent({
    inviterName,
    organizationName,
    role,
    inviteUrl,
    expiresInDays,
  });

  // Try SMTP first
  const smtpConfig = await smtpChannel.getConfig(organizationId);
  const smtpEnabled = await smtpChannel.isEnabled(organizationId);

  if (smtpConfig && smtpEnabled) {
    const result = await smtpChannel.send(
      { subject, html, text },
      [{ email: recipientEmail }],
      smtpConfig
    );

    if (result.success) {
      logger.info({ email: recipientEmail }, "Invitation email sent via SMTP");
      return;
    }

    logger.warn(
      { error: result.error },
      "Failed to send invitation via SMTP, trying Resend"
    );
  }

  // Try Resend
  const resendConfig = await resendChannel.getConfig(organizationId);
  const resendEnabled = await resendChannel.isEnabled(organizationId);

  if (resendConfig && resendEnabled) {
    const result = await resendChannel.send(
      { subject, html, text },
      [{ email: recipientEmail }],
      resendConfig
    );

    if (result.success) {
      logger.info({ email: recipientEmail }, "Invitation email sent via Resend");
      return;
    }

    logger.error({ error: result.error }, "Failed to send invitation via Resend");
    throw new Error(`Failed to send invitation email: ${result.error}`);
  }

  // No email channel configured
  logger.warn(
    "No email channel configured, invitation email not sent"
  );
}

interface EmailContentParams {
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
  expiresInDays: number;
}

function generateInvitationEmailContent(params: EmailContentParams): {
  html: string;
  text: string;
} {
  const { inviterName, organizationName, role, inviteUrl, expiresInDays } =
    params;

  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Granyt</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px; font-weight: 600;">
                You've been invited to join ${organizationName}
              </h2>

              <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 24px;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${roleDisplay}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 500;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; color: #71717a; font-size: 14px; line-height: 20px;">
                This invitation expires in ${expiresInDays} days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                Sent by Granyt - Data Pipeline Observability
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
You've been invited to join ${organizationName}

${inviterName} has invited you to join ${organizationName} as a ${roleDisplay}.

Accept the invitation by visiting:
${inviteUrl}

This invitation expires in ${expiresInDays} days.

If you didn't expect this invitation, you can safely ignore this email.

---
Sent by Granyt - Data Pipeline Observability
  `.trim();

  return { html, text };
}
