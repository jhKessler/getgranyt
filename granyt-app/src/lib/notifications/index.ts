export {
  // Types
  type NotificationInputType,
  type NotificationSelectOption,
  type NotificationSettingConfig,
  type NotificationCategory,
  type NotificationTypeKey,
  type NotificationTypeValue,

  // Constants
  NotificationTypes,

  // Config arrays
  ALERT_NOTIFICATIONS,
  ERROR_NOTIFICATIONS,
  NOTIFICATION_CATEGORIES,
  ALL_NOTIFICATION_SETTINGS,

  // Helper functions
  getNotificationDefaults,
  getNotificationSettingByType,
  isSwitchSetting,
  isSelectSetting,

  // Maps
  ALERT_TYPE_TO_NOTIFICATION_TYPE,
} from "./config";
