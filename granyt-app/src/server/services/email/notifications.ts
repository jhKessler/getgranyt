import { shouldSendAlertNotification, shouldSendErrorNotification } from "./config";
import { sendEmail } from "./send";
import {
  generateAlertEmailHtml,
  generateAlertEmailText,
  generateErrorEmailHtml,
  generateErrorEmailText,
} from "./templates";
import type { AlertEmailParams, ErrorEmailParams } from "./types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("EmailNotifications");

const ALERT_TYPE_SUBJECTS: Record<string, string> = {
  ROW_COUNT_DROP: "Row Count Drop Alert",
  NULL_OCCURRENCE: "Null Column Alert",
  SCHEMA_CHANGE: "Schema Change Alert",
};

/**
 * Sends an alert notification email to all configured recipients
 */
export async function sendAlertNotification(
  organizationId: string,
  params: AlertEmailParams
): Promise<{ sent: boolean; error?: string }> {
  try {
    const checkResult = await shouldSendAlertNotification(
      organizationId,
      params.alertType
    );

    if (!checkResult.shouldSend || !checkResult.smtpConfig) {
      return { sent: false };
    }

    const subject = `[Granyt] ${ALERT_TYPE_SUBJECTS[params.alertType] || "Alert"} - ${params.dagId}`;

    const result = await sendEmail(checkResult.smtpConfig, {
      to: checkResult.recipients,
      subject,
      html: generateAlertEmailHtml(params),
      text: generateAlertEmailText(params),
    });

    if (!result.success) {
      logger.error(
        { error: result.error, organizationId, dagId: params.dagId },
        "Failed to send alert notification"
      );
      return { sent: false, error: result.error };
    }

    logger.info(
      {
        recipients: checkResult.recipients.length,
        alertType: params.alertType,
        organizationId,
      },
      "Alert notification sent"
    );
    return { sent: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage, organizationId, dagId: params.dagId },
      "Error sending alert notification"
    );
    return { sent: false, error: errorMessage };
  }
}

/**
 * Sends an error notification email to all configured recipients
 */
export async function sendErrorNotification(
  organizationId: string,
  params: ErrorEmailParams
): Promise<{ sent: boolean; error?: string }> {
  try {
    const checkResult = await shouldSendErrorNotification(
      organizationId,
      params.isNewError ?? false
    );

    if (!checkResult.shouldSend || !checkResult.smtpConfig) {
      return { sent: false };
    }

    const subject = `[Granyt] ${params.isNewError ? "New " : ""}Error: ${params.errorType}${params.dagId ? ` - ${params.dagId}` : ""}`;

    const result = await sendEmail(checkResult.smtpConfig, {
      to: checkResult.recipients,
      subject,
      html: generateErrorEmailHtml(params),
      text: generateErrorEmailText(params),
    });

    if (!result.success) {
      logger.error(
        { error: result.error, organizationId, dagId: params.dagId },
        "Failed to send error notification"
      );
      return { sent: false, error: result.error };
    }

    logger.info(
      {
        recipients: checkResult.recipients.length,
        organizationId,
      },
      "Error notification sent"
    );
    return { sent: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage, organizationId, dagId: params.dagId },
      "Error sending error notification"
    );
    return { sent: false, error: errorMessage };
  }
}
