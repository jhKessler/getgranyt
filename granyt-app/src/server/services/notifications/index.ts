/**
 * Notification Service
 * 
 * Main exports for the notification system.
 * 
 * @example
 * ```typescript
 * import { notify, NotificationEventType } from "@/server/services/notifications";
 * 
 * // Send an alert notification
 * await notify({
 *   organizationId: "org_123",
 *   type: NotificationEventType.ROW_COUNT_DROP_ALERT,
 *   severity: "warning",
 *   dagId: "my_dag",
 *   metadata: { baseline: 1000, current: 500, dropPercentage: 50 },
 * });
 * 
 * // Send an error notification
 * await notify({
 *   organizationId: "org_123",
 *   type: NotificationEventType.PIPELINE_ERROR,
 *   severity: "critical",
 *   errorType: "ValueError",
 *   errorMessage: "Something went wrong",
 *   dagId: "my_dag",
 *   isNewError: true,
 * });
 * ```
 */

// Main entry points
export { notify, notifyForced } from "./dispatcher";

// Types
export {
  NotificationEventType,
  ChannelType,
  type NotificationPayload,
  type AlertNotificationPayload,
  type ErrorNotificationPayload,
  type BatchAlertNotificationPayload,
  type BatchAlertItem,
  type NotificationSeverity,
  type NotifyResult,
  type SendResult,
  type TestResult,
  type NotificationRecipient,
  type RenderedNotification,
  type SmtpChannelConfig,
  type ResendChannelConfig,
  type WebhookChannelConfig,
  type ChannelConfig,
  isAlertPayload,
  isErrorPayload,
  isBatchAlertPayload,
} from "./types";

// Config helpers
export {
  getUsersWithNotificationEnabled,
  getNotificationSetting,
  updateNotificationSetting,
} from "./config";

// Filter helpers
export {
  getUserNotificationFilters,
  updateUserNotificationFilters,
  getDefaultEnvironmentName,
  shouldSendNotificationToUser,
  filterRecipientsByPreferences,
  type NotificationFilters,
  type EnvironmentFilter,
} from "./filters";

// Channel management
export {
  getChannel,
  getAllChannels,
  getAllChannelTypes,
  getActiveChannels,
  getChannelStatuses,
  NotificationChannel,
  smtpChannel,
  resendChannel,
  webhookChannel,
} from "./channels";

// Templates
export { renderNotification } from "./templates";
