import nodemailer from "nodemailer";
import type { SmtpConfig, SendEmailParams, EmailRecipient } from "./types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("EmailService");

/**
 * Creates a nodemailer transporter from SMTP config
 */
function createTransporter(config: SmtpConfig) {
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

/**
 * Formats recipients for nodemailer
 */
function formatRecipients(recipients: EmailRecipient[]): string {
  return recipients
    .map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email))
    .join(", ");
}

/**
 * Sends an email using the provided SMTP configuration
 */
export async function sendEmail(
  config: SmtpConfig,
  params: SendEmailParams
): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter(config);

  try {
    await transporter.sendMail({
      from: config.fromName
        ? `"${config.fromName}" <${config.fromEmail}>`
        : config.fromEmail,
      to: formatRecipients(params.to),
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error sending email";
    logger.error({ error: errorMessage, host: config.host }, "Failed to send email");
    return { success: false, error: errorMessage };
  }
}

/**
 * Tests SMTP connection
 */
export async function testSmtpConnection(
  config: SmtpConfig
): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter(config);

  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error testing SMTP";
    return { success: false, error: errorMessage };
  }
}

/**
 * Sends a test email to verify SMTP setup
 */
export async function sendTestEmail(
  config: SmtpConfig,
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail(config, {
    to: [{ email: recipientEmail }],
    subject: "Granyt - SMTP Test Email",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">🛡️ Granyt SMTP Test</h2>
        <p>This is a test email to verify your SMTP configuration is working correctly.</p>
        <p>If you received this email, your SMTP settings are configured properly!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This email was sent from Granyt to test your notification settings.
        </p>
      </div>
    `,
    text: "Granyt SMTP Test\n\nThis is a test email to verify your SMTP configuration is working correctly.\n\nIf you received this email, your SMTP settings are configured properly!",
  });
}
