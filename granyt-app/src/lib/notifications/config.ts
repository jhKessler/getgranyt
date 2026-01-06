import type { LucideIcon } from "lucide-react";
import { Bell, AlertTriangle, Database, Columns, LayoutList } from "lucide-react";

// ============================================================================
// NOTIFICATION TYPE - Must match Prisma NotificationType enum
// ============================================================================

/**
 * Notification types - keep in sync with prisma/notifications.prisma
 */
export const NotificationTypes = {
  ALL_ALERTS: "ALL_ALERTS",
  NULL_OCCURRENCE_ALERT: "NULL_OCCURRENCE_ALERT",
  SCHEMA_CHANGE_ALERT: "SCHEMA_CHANGE_ALERT",
  ROW_COUNT_DROP_ALERT: "ROW_COUNT_DROP_ALERT",
  ALL_ERRORS: "ALL_ERRORS",
  NEW_ERRORS_ONLY: "NEW_ERRORS_ONLY",
} as const;

export type NotificationTypeKey = keyof typeof NotificationTypes;
export type NotificationTypeValue = (typeof NotificationTypes)[NotificationTypeKey];

// ============================================================================
// NOTIFICATION SETTING TYPES
// ============================================================================

/**
 * Input types for notification settings
 * - switch: Simple on/off toggle
 * - select: Dropdown with multiple options
 */
export type NotificationInputType = "switch" | "select";

/**
 * Option for select-type notification settings
 */
export interface NotificationSelectOption {
  value: string;
  label: string;
}

/**
 * Base configuration for a notification setting
 */
interface BaseNotificationSetting {
  /** Unique identifier matching the Prisma NotificationType enum */
  type: NotificationTypeValue;
  /** Display label in UI */
  label: string;
  /** Description shown below label */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Default enabled state */
  defaultEnabled: boolean;
}

/**
 * Switch-type notification setting (simple toggle)
 */
interface SwitchNotificationSetting extends BaseNotificationSetting {
  inputType: "switch";
  /** If true, this is a parent toggle that controls children */
  isParent?: boolean;
  /** Parent type if this is a child setting */
  parentType?: NotificationTypeValue;
}

/**
 * Select-type notification setting (dropdown with options)
 */
interface SelectNotificationSetting extends BaseNotificationSetting {
  inputType: "select";
  /** Options for the select dropdown */
  options: NotificationSelectOption[];
  /** Key in the settings record that determines "disabled" state */
  disabledWhen: (settings: Record<string, boolean>) => boolean;
  /** Convert select value to settings record updates */
  toSettingsUpdate: (value: string) => Array<{ type: NotificationTypeValue; enabled: boolean }>;
  /** Get current select value from settings record */
  fromSettings: (settings: Record<string, boolean>) => string;
}

export type NotificationSettingConfig = SwitchNotificationSetting | SelectNotificationSetting;

// ============================================================================
// NOTIFICATION CATEGORIES
// ============================================================================

/**
 * Category for grouping related notification settings
 */
export interface NotificationCategory {
  id: string;
  label: string;
  description?: string;
  settings: NotificationSettingConfig[];
}

// ============================================================================
// NOTIFICATION SETTINGS CONFIGURATION
// ============================================================================

/**
 * Alert notification settings
 */
export const ALERT_NOTIFICATIONS: NotificationSettingConfig[] = [
  {
    type: "ALL_ALERTS",
    label: "All Alerts",
    description: "Master toggle for all alert notifications",
    icon: Bell,
    inputType: "switch",
    isParent: true,
    defaultEnabled: true,
  },
  {
    type: "ROW_COUNT_DROP_ALERT",
    label: "Row Count Drop Alerts",
    description: "When data row counts drop significantly",
    icon: Database,
    inputType: "switch",
    parentType: "ALL_ALERTS",
    defaultEnabled: true,
  },
  {
    type: "NULL_OCCURRENCE_ALERT",
    label: "Null Column Alerts",
    description: "When columns that previously had no nulls start having them",
    icon: Columns,
    inputType: "switch",
    parentType: "ALL_ALERTS",
    defaultEnabled: true,
  },
  {
    type: "SCHEMA_CHANGE_ALERT",
    label: "Schema Change Alerts",
    description: "When columns are added, removed, or have type changes",
    icon: LayoutList,
    inputType: "switch",
    parentType: "ALL_ALERTS",
    defaultEnabled: true,
  },
];

/**
 * Error notification settings
 */
export const ERROR_NOTIFICATIONS: NotificationSettingConfig[] = [
  {
    type: "ALL_ERRORS", // We use ALL_ERRORS as the "main" type for this select
    label: "Error Notifications",
    description: "Receive notifications for DAG errors",
    icon: AlertTriangle,
    inputType: "select",
    defaultEnabled: true, // NEW_ERRORS_ONLY is default enabled
    options: [
      { value: "disabled", label: "Disabled" },
      { value: "new_errors", label: "New Errors" },
      { value: "all_errors", label: "All Errors" },
    ],
    disabledWhen: (settings) => !settings["ALL_ERRORS"] && !settings["NEW_ERRORS_ONLY"],
    toSettingsUpdate: (value) => {
      switch (value) {
        case "disabled":
          return [
            { type: "ALL_ERRORS", enabled: false },
            { type: "NEW_ERRORS_ONLY", enabled: false },
          ];
        case "new_errors":
          return [
            { type: "ALL_ERRORS", enabled: false },
            { type: "NEW_ERRORS_ONLY", enabled: true },
          ];
        case "all_errors":
          return [
            { type: "ALL_ERRORS", enabled: true },
            { type: "NEW_ERRORS_ONLY", enabled: false },
          ];
        default:
          return [];
      }
    },
    fromSettings: (settings) => {
      const allErrors = settings["ALL_ERRORS"] ?? false;
      const newErrorsOnly = settings["NEW_ERRORS_ONLY"] ?? false;

      if (newErrorsOnly) return "new_errors";
      if (allErrors) return "all_errors";
      return "disabled";
    },
  },
];

/**
 * All notification categories
 */
export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: "alerts",
    label: "Alerts",
    description: "Data quality and DAG alerts",
    settings: ALERT_NOTIFICATIONS,
  },
  {
    id: "errors",
    label: "Errors",
    description: "DAG error notifications",
    settings: ERROR_NOTIFICATIONS,
  },
];

/**
 * Flat list of all notification settings
 */
export const ALL_NOTIFICATION_SETTINGS: NotificationSettingConfig[] = [
  ...ALERT_NOTIFICATIONS,
  ...ERROR_NOTIFICATIONS,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default values for all notification settings
 */
export function getNotificationDefaults(): Record<NotificationTypeValue, boolean> {
  const defaults: Partial<Record<NotificationTypeValue, boolean>> = {};

  for (const setting of ALL_NOTIFICATION_SETTINGS) {
    defaults[setting.type] = setting.defaultEnabled;
  }

  // Handle composite settings (like error notifications that control multiple types)
  // NEW_ERRORS_ONLY needs to be included even though it's not a direct setting
  // Default to NEW_ERRORS_ONLY being enabled (new errors only mode)
  if (!("NEW_ERRORS_ONLY" in defaults)) {
    defaults["NEW_ERRORS_ONLY"] = true;
  }
  // ALL_ERRORS should be false when NEW_ERRORS_ONLY is the default
  if (!("ALL_ERRORS" in defaults) || defaults["ALL_ERRORS"]) {
    defaults["ALL_ERRORS"] = false;
  }

  return defaults as Record<NotificationTypeValue, boolean>;
}

/**
 * Get a notification setting config by type
 */
export function getNotificationSettingByType(
  type: NotificationTypeValue
): NotificationSettingConfig | undefined {
  return ALL_NOTIFICATION_SETTINGS.find((s) => s.type === type);
}

/**
 * Check if a setting is a switch type
 */
export function isSwitchSetting(
  setting: NotificationSettingConfig
): setting is SwitchNotificationSetting {
  return setting.inputType === "switch";
}

/**
 * Check if a setting is a select type
 */
export function isSelectSetting(
  setting: NotificationSettingConfig
): setting is SelectNotificationSetting {
  return setting.inputType === "select";
}

/**
 * Map alert types to notification types for email logic
 */
export const ALERT_TYPE_TO_NOTIFICATION_TYPE: Record<string, NotificationTypeValue> = {
  ROW_COUNT_DROP: "ROW_COUNT_DROP_ALERT",
  NULL_OCCURRENCE: "NULL_OCCURRENCE_ALERT",
  SCHEMA_CHANGE: "SCHEMA_CHANGE_ALERT",
};
