// Email service exports
export { sendEmail, testSmtpConnection, sendTestEmail } from "./send";
export { getSmtpConfig, isNotificationEnabled } from "./config";
export { sendAlertNotification, sendErrorNotification } from "./notifications";
export {
  generateAlertEmailHtml,
  generateAlertEmailText,
  generateErrorEmailHtml,
  generateErrorEmailText,
} from "./templates";
export type {
  SmtpConfig,
  EmailRecipient,
  SendEmailParams,
  AlertEmailParams,
  ErrorEmailParams,
} from "./types";
