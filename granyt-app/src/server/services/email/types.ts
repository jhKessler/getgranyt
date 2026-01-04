import { ALERT_TYPE_TO_NOTIFICATION_TYPE } from "@/lib/notifications";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  fromEmail: string;
  fromName: string;
}

export interface EmailRecipient {
  email: string;
  name?: string | null;
}

export interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
}

export interface AlertEmailParams {
  alertType: "ROW_COUNT_DROP" | "NULL_OCCURRENCE" | "SCHEMA_CHANGE";
  severity: string;
  dagId: string;
  captureId?: string | null;
  metadata: Record<string, unknown>;
  dashboardUrl?: string;
}

export interface ErrorEmailParams {
  errorType: string;
  errorMessage: string;
  dagId?: string;
  taskId?: string;
  runId?: string;
  stackTrace?: string;
  isNewError?: boolean;
  dashboardUrl?: string;
}

export interface NotificationCheckResult {
  shouldSend: boolean;
  recipients: EmailRecipient[];
  smtpConfig: SmtpConfig | null;
}

// Re-export for backwards compatibility
export { ALERT_TYPE_TO_NOTIFICATION_TYPE };
