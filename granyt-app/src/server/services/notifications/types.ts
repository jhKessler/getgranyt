/**
 * Notification service types
 * 
 * This file contains all TypeScript interfaces and enums for the notification system.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * All possible notification events in the system.
 * This maps to the settings users can toggle on/off.
 */
export enum NotificationEventType {
  // Alerts
  ROW_COUNT_DROP_ALERT = "ROW_COUNT_DROP_ALERT",
  NULL_OCCURRENCE_ALERT = "NULL_OCCURRENCE_ALERT",
  SCHEMA_CHANGE_ALERT = "SCHEMA_CHANGE_ALERT",
  
  // Batch alerts (summary of multiple alerts from a single DAG run)
  DAG_RUN_ALERTS_SUMMARY = "DAG_RUN_ALERTS_SUMMARY",
  
  // Errors
  PIPELINE_ERROR = "PIPELINE_ERROR",
  NEW_PIPELINE_ERROR = "NEW_PIPELINE_ERROR",
}

/**
 * Available notification channels.
 * Must match Prisma ChannelType enum.
 */
export enum ChannelType {
  SMTP = "SMTP",
  RESEND = "RESEND",
  WEBHOOK = "WEBHOOK",
}

/**
 * Notification severity levels
 */
export type NotificationSeverity = "info" | "warning" | "critical";

// ============================================================================
// NOTIFICATION PAYLOADS
// ============================================================================

/**
 * Base payload all notifications share
 */
interface BaseNotificationPayload {
  organizationId: string;
  severity: NotificationSeverity;
  timestamp?: Date;
  dashboardUrl?: string;
}

/**
 * Alert-specific payload
 */
export interface AlertNotificationPayload extends BaseNotificationPayload {
  type: 
    | NotificationEventType.ROW_COUNT_DROP_ALERT 
    | NotificationEventType.NULL_OCCURRENCE_ALERT 
    | NotificationEventType.SCHEMA_CHANGE_ALERT;
  dagId: string;
  captureId?: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Single alert item within a batch
 */
export interface BatchAlertItem {
  alertId: string;
  alertType: "ROW_COUNT_DROP" | "NULL_OCCURRENCE" | "SCHEMA_CHANGE";
  severity: NotificationSeverity;
  captureId?: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Batch alert payload - summary of multiple alerts from a single DAG run
 */
export interface BatchAlertNotificationPayload extends BaseNotificationPayload {
  type: NotificationEventType.DAG_RUN_ALERTS_SUMMARY;
  dagId: string;
  dagRunId: string;
  srcRunId?: string;
  environment?: string | null;
  alerts: BatchAlertItem[];
}

/**
 * Error-specific payload
 */
export interface ErrorNotificationPayload extends BaseNotificationPayload {
  type: NotificationEventType.PIPELINE_ERROR | NotificationEventType.NEW_PIPELINE_ERROR;
  errorType: string;
  errorMessage: string;
  dagId?: string;
  taskId?: string;
  runId?: string;
  stackTrace?: string;
  isNewError?: boolean;
}

/**
 * Union of all notification payloads
 */
export type NotificationPayload = AlertNotificationPayload | ErrorNotificationPayload | BatchAlertNotificationPayload;

// ============================================================================
// CHANNEL TYPES
// ============================================================================

/**
 * Result from sending a notification
 */
export interface SendResult {
  success: boolean;
  error?: string;
}

/**
 * Result from testing a channel connection
 */
export interface TestResult {
  success: boolean;
  error?: string;
}

/**
 * Rendered notification ready to send
 */
export interface RenderedNotification {
  subject: string;
  html: string;
  text: string;
  payload?: NotificationPayload;
}

/**
 * Recipient info
 */
export interface NotificationRecipient {
  email: string;
  name?: string | null;
}

// ============================================================================
// CHANNEL CONFIG TYPES
// ============================================================================

/**
 * SMTP channel configuration
 */
export interface SmtpChannelConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  fromEmail: string;
  fromName?: string;
}

/**
 * Resend channel configuration
 */
export interface ResendChannelConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

/**
 * Webhook channel configuration
 */
export interface WebhookChannelConfig {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
}

/**
 * Union of all channel configs
 */
export type ChannelConfig = SmtpChannelConfig | ResendChannelConfig | WebhookChannelConfig;

// ============================================================================
// NOTIFY RESULT
// ============================================================================

/**
 * Result from the notify() function
 */
export interface NotifyResult {
  sent: boolean;
  channels: Array<{
    channel: string;
    type: ChannelType;
    success: boolean;
    error?: string;
  }>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isAlertPayload(payload: NotificationPayload): payload is AlertNotificationPayload {
  return [
    NotificationEventType.ROW_COUNT_DROP_ALERT,
    NotificationEventType.NULL_OCCURRENCE_ALERT,
    NotificationEventType.SCHEMA_CHANGE_ALERT,
  ].includes(payload.type);
}

export function isErrorPayload(payload: NotificationPayload): payload is ErrorNotificationPayload {
  return [
    NotificationEventType.PIPELINE_ERROR,
    NotificationEventType.NEW_PIPELINE_ERROR,
  ].includes(payload.type);
}

export function isBatchAlertPayload(payload: NotificationPayload): payload is BatchAlertNotificationPayload {
  return payload.type === NotificationEventType.DAG_RUN_ALERTS_SUMMARY;
}
