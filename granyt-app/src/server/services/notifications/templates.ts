/**
 * Notification templates
 * 
 * Renders notification payloads into HTML/text content for sending.
 */

import {
  type NotificationPayload,
  type RenderedNotification,
  type AlertNotificationPayload,
  type ErrorNotificationPayload,
  type BatchAlertNotificationPayload,
  type BatchAlertItem,
  isAlertPayload,
  isErrorPayload,
  isBatchAlertPayload,
  NotificationEventType,
} from "./types";

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  warning: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  info: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  [NotificationEventType.ROW_COUNT_DROP_ALERT]: "Row Count Drop",
  [NotificationEventType.NULL_OCCURRENCE_ALERT]: "Null Column Detected",
  [NotificationEventType.SCHEMA_CHANGE_ALERT]: "Schema Change",
};

/**
 * Render a notification payload into HTML/text content
 */
export function renderNotification(payload: NotificationPayload): RenderedNotification {
  let rendered: RenderedNotification;

  if (isBatchAlertPayload(payload)) {
    rendered = renderBatchAlertNotification(payload);
  } else if (isAlertPayload(payload)) {
    rendered = renderAlertNotification(payload);
  } else if (isErrorPayload(payload)) {
    rendered = renderErrorNotification(payload);
  } else {
    // Fallback - should never happen with proper typing
    rendered = {
      subject: "[Granyt] Notification",
      html: "<p>You have a new notification from Granyt.</p>",
      text: "You have a new notification from Granyt.",
    };
  }

  return {
    ...rendered,
    payload,
  };
}

/**
 * Render alert notification
 */
function renderAlertNotification(payload: AlertNotificationPayload): RenderedNotification {
  const alertLabel = ALERT_TYPE_LABELS[payload.type] || payload.type;
  const subject = `[Granyt] ${alertLabel} Alert - ${payload.dagId}`;

  return {
    subject,
    html: generateAlertHtml(payload, alertLabel),
    text: generateAlertText(payload, alertLabel),
  };
}

/**
 * Render error notification
 */
function renderErrorNotification(payload: ErrorNotificationPayload): RenderedNotification {
  const isNew = payload.isNewError || payload.type === NotificationEventType.NEW_PIPELINE_ERROR;
  const subject = `[Granyt] ${isNew ? "New " : ""}Error: ${payload.errorType}${payload.dagId ? ` - ${payload.dagId}` : ""}`;

  return {
    subject,
    html: generateErrorHtml(payload, isNew),
    text: generateErrorText(payload, isNew),
  };
}

/**
 * Render batch alert notification (summary of multiple alerts from a DAG run)
 */
function renderBatchAlertNotification(payload: BatchAlertNotificationPayload): RenderedNotification {
  const alertCount = payload.alerts.length;
  const subject = `[Granyt] ${alertCount} Alert${alertCount > 1 ? "s" : ""} Triggered - ${payload.dagId}`;

  return {
    subject,
    html: generateBatchAlertHtml(payload),
    text: generateBatchAlertText(payload),
  };
}

// ============================================================================
// ALERT TEMPLATES
// ============================================================================

function generateAlertHtml(payload: AlertNotificationPayload, alertLabel: string): string {
  const colors = SEVERITY_COLORS[payload.severity] || SEVERITY_COLORS.warning;

  let metadataHtml = "";

  if (payload.type === NotificationEventType.ROW_COUNT_DROP_ALERT) {
    const meta = payload.metadata as {
      baseline?: number;
      current?: number;
      dropPercentage?: number;
    };
    metadataHtml = `
      <tr><td style="padding: 8px; color: #6b7280;">Previous Row Count</td><td style="padding: 8px; font-weight: 500;">${meta.baseline?.toLocaleString() ?? "N/A"}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Current Row Count</td><td style="padding: 8px; font-weight: 500;">${meta.current?.toLocaleString() ?? "N/A"}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Drop Percentage</td><td style="padding: 8px; font-weight: 500; color: ${colors.text};">${meta.dropPercentage?.toFixed(1) ?? "N/A"}%</td></tr>
    `;
  } else if (payload.type === NotificationEventType.NULL_OCCURRENCE_ALERT) {
    const meta = payload.metadata as {
      affectedColumns?: Array<{ name: string; nullCount: number; dtype: string }>;
      columnCount?: number;
      totalNullCount?: number;
      historicalOccurrencesAnalyzed?: number;
    };
    const columnNames = meta.affectedColumns?.map(c => c.name).join(", ") ?? "N/A";
    metadataHtml = `
      <tr><td style="padding: 8px; color: #6b7280;">Affected Columns</td><td style="padding: 8px; font-weight: 500;">${meta.columnCount ?? meta.affectedColumns?.length ?? "N/A"}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Column Names</td><td style="padding: 8px; font-weight: 500;">${columnNames}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Total Null Count</td><td style="padding: 8px; font-weight: 500; color: ${colors.text};">${meta.totalNullCount?.toLocaleString() ?? "N/A"}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Historical Runs Analyzed</td><td style="padding: 8px; font-weight: 500;">${meta.historicalOccurrencesAnalyzed ?? "N/A"}</td></tr>
    `;
  } else if (payload.type === NotificationEventType.SCHEMA_CHANGE_ALERT) {
    const meta = payload.metadata as {
      summary?: {
        addedCount: number;
        removedCount: number;
        typeChangedCount: number;
        totalChanges: number;
      };
      addedColumns?: Array<{ name: string; type?: string }>;
      removedColumns?: Array<{ name: string; type?: string }>;
      typeChangedColumns?: Array<{ name: string; previousType?: string; currentType?: string }>;
    };
    const changesSummary = [];
    if (meta.summary?.addedCount) changesSummary.push(`${meta.summary.addedCount} added`);
    if (meta.summary?.removedCount) changesSummary.push(`${meta.summary.removedCount} removed`);
    if (meta.summary?.typeChangedCount) changesSummary.push(`${meta.summary.typeChangedCount} type changed`);
    const changesText = changesSummary.length > 0 ? changesSummary.join(", ") : "N/A";
    
    const affectedColumns = [
      ...(meta.addedColumns?.map(c => c.name) ?? []),
      ...(meta.removedColumns?.map(c => c.name) ?? []),
      ...(meta.typeChangedColumns?.map(c => c.name) ?? []),
    ].join(", ") || "N/A";
    
    metadataHtml = `
      <tr><td style="padding: 8px; color: #6b7280;">Total Changes</td><td style="padding: 8px; font-weight: 500;">${meta.summary?.totalChanges ?? "N/A"}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Changes</td><td style="padding: 8px; font-weight: 500;">${changesText}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Affected Columns</td><td style="padding: 8px; font-weight: 500;">${affectedColumns}</td></tr>
    `;
  }

  return `
    <div style="${BASE_STYLES}">
      <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; color: ${colors.text};">⚠️ ${alertLabel} Alert</h2>
        <p style="margin: 0; color: #4b5563;">A ${payload.severity} alert has been triggered for your DAG.</p>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827;">Alert Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #6b7280;">DAG</td><td style="padding: 8px; font-weight: 500;">${payload.dagId}</td></tr>
          ${payload.captureId ? `<tr><td style="padding: 8px; color: #6b7280;">Capture Point</td><td style="padding: 8px; font-weight: 500;">${payload.captureId}</td></tr>` : ""}
          ${metadataHtml}
        </table>
      </div>

      ${payload.dashboardUrl ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${payload.dashboardUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View in Dashboard
          </a>
        </div>
      ` : ""}

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        You received this email because you're subscribed to Granyt alerts.<br>
        Manage your notification preferences in the dashboard settings.
      </p>
    </div>
  `;
}

function generateAlertText(payload: AlertNotificationPayload, alertLabel: string): string {
  let metadataText = "";

  if (payload.type === NotificationEventType.ROW_COUNT_DROP_ALERT) {
    const meta = payload.metadata as {
      baseline?: number;
      current?: number;
      dropPercentage?: number;
    };
    metadataText = `
Previous Row Count: ${meta.baseline?.toLocaleString() ?? "N/A"}
Current Row Count: ${meta.current?.toLocaleString() ?? "N/A"}
Drop Percentage: ${meta.dropPercentage?.toFixed(1) ?? "N/A"}%`;
  } else if (payload.type === NotificationEventType.NULL_OCCURRENCE_ALERT) {
    const meta = payload.metadata as {
      affectedColumns?: Array<{ name: string; nullCount: number; dtype: string }>;
      columnCount?: number;
      totalNullCount?: number;
      historicalOccurrencesAnalyzed?: number;
    };
    const columnNames = meta.affectedColumns?.map(c => c.name).join(", ") ?? "N/A";
    metadataText = `
Affected Columns: ${meta.columnCount ?? meta.affectedColumns?.length ?? "N/A"}
Column Names: ${columnNames}
Total Null Count: ${meta.totalNullCount?.toLocaleString() ?? "N/A"}
Historical Runs Analyzed: ${meta.historicalOccurrencesAnalyzed ?? "N/A"}`;
  } else if (payload.type === NotificationEventType.SCHEMA_CHANGE_ALERT) {
    const meta = payload.metadata as {
      summary?: {
        addedCount: number;
        removedCount: number;
        typeChangedCount: number;
        totalChanges: number;
      };
      addedColumns?: Array<{ name: string; type?: string }>;
      removedColumns?: Array<{ name: string; type?: string }>;
      typeChangedColumns?: Array<{ name: string; previousType?: string; currentType?: string }>;
    };
    const changesSummary = [];
    if (meta.summary?.addedCount) changesSummary.push(`${meta.summary.addedCount} added`);
    if (meta.summary?.removedCount) changesSummary.push(`${meta.summary.removedCount} removed`);
    if (meta.summary?.typeChangedCount) changesSummary.push(`${meta.summary.typeChangedCount} type changed`);
    const changesText = changesSummary.length > 0 ? changesSummary.join(", ") : "N/A";
    
    const affectedColumns = [
      ...(meta.addedColumns?.map(c => c.name) ?? []),
      ...(meta.removedColumns?.map(c => c.name) ?? []),
      ...(meta.typeChangedColumns?.map(c => c.name) ?? []),
    ].join(", ") || "N/A";
    
    metadataText = `
Total Changes: ${meta.summary?.totalChanges ?? "N/A"}
Changes: ${changesText}
Affected Columns: ${affectedColumns}`;
  }

  return `
${alertLabel} Alert

A ${payload.severity} alert has been triggered for your DAG.

Alert Details:
DAG: ${payload.dagId}
${payload.captureId ? `Capture Point: ${payload.captureId}\n` : ""}${metadataText}

${payload.dashboardUrl ? `View in Dashboard: ${payload.dashboardUrl}` : ""}

---
You received this email because you're subscribed to Granyt alerts.
Manage your notification preferences in the dashboard settings.
`.trim();
}

// ============================================================================
// BATCH ALERT TEMPLATES
// ============================================================================

const ALERT_TYPE_DISPLAY: Record<string, { label: string; icon: string }> = {
  ROW_COUNT_DROP: { label: "Row Count Drop", icon: "📉" },
  NULL_OCCURRENCE: { label: "Null Occurrence", icon: "⚠️" },
  SCHEMA_CHANGE: { label: "Schema Change", icon: "🔄" },
};

function generateBatchAlertHtml(payload: BatchAlertNotificationPayload): string {
  const alertCount = payload.alerts.length;
  const hasCritical = payload.alerts.some(a => a.severity === "critical");
  const headerColors = hasCritical ? SEVERITY_COLORS.critical : SEVERITY_COLORS.warning;

  const alertItemsHtml = payload.alerts.map(alert => generateAlertItemHtml(alert, payload.dashboardUrl)).join("");

  return `
    <div style="${BASE_STYLES}">
      <div style="background: ${headerColors.bg}; border: 1px solid ${headerColors.border}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; color: ${headerColors.text};">🚨 DAG Run Alert Summary</h2>
        <p style="margin: 0; color: #4b5563;">${alertCount} alert${alertCount > 1 ? "s" : ""} triggered during this run.</p>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827;">Run Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #6b7280;">DAG</td><td style="padding: 8px; font-weight: 500;">${payload.dagId}</td></tr>
          ${payload.srcRunId ? `<tr><td style="padding: 8px; color: #6b7280;">Run ID</td><td style="padding: 8px; font-weight: 500; font-family: monospace; font-size: 13px;">${payload.srcRunId}</td></tr>` : ""}
          ${payload.environment ? `<tr><td style="padding: 8px; color: #6b7280;">Environment</td><td style="padding: 8px; font-weight: 500;">${payload.environment}</td></tr>` : ""}
          <tr><td style="padding: 8px; color: #6b7280;">Alerts Triggered</td><td style="padding: 8px; font-weight: 500; color: ${headerColors.text};">${alertCount}</td></tr>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; color: #111827;">Alerts</h3>
        ${alertItemsHtml}
      </div>

      ${payload.dashboardUrl ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${payload.dashboardUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View Run in Dashboard
          </a>
        </div>
      ` : ""}

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        You received this email because you're subscribed to Granyt alerts.<br>
        Manage your notification preferences in the dashboard settings.
      </p>
    </div>
  `;
}

function generateAlertItemHtml(alert: BatchAlertItem, baseUrl?: string): string {
  const display = ALERT_TYPE_DISPLAY[alert.alertType] || { label: alert.alertType, icon: "⚠️" };
  const colors = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.warning;
  const metadataHtml = generateAlertMetadataHtml(alert);
  const alertUrl = baseUrl ? baseUrl.replace(/\/runs\/[^/]+$/, `/alerts/${alert.alertId}`) : undefined;

  return `
    <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <h4 style="margin: 0; color: ${colors.text};">${display.icon} ${display.label}</h4>
        <span style="background: ${colors.border}; color: ${colors.text}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; text-transform: uppercase;">${alert.severity}</span>
      </div>
      ${alert.captureId ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Capture Point: <strong>${alert.captureId}</strong></p>` : ""}
      ${metadataHtml}
      ${alertUrl ? `<a href="${alertUrl}" style="color: #0ea5e9; font-size: 13px; text-decoration: none;">View details →</a>` : ""}
    </div>
  `;
}

function generateAlertMetadataHtml(alert: BatchAlertItem): string {
  const meta = alert.metadata;

  if (alert.alertType === "ROW_COUNT_DROP") {
    const baseline = (meta.baseline as number)?.toLocaleString() ?? "N/A";
    const current = (meta.current as number)?.toLocaleString() ?? "N/A";
    const dropPct = (meta.dropPercentage as number)?.toFixed(1) ?? "N/A";
    return `<p style="margin: 0; color: #4b5563; font-size: 14px;">${baseline} → ${current} (${dropPct}% drop)</p>`;
  }

  if (alert.alertType === "NULL_OCCURRENCE") {
    const columns = (meta.affectedColumns as Array<{ name: string }>)?.map(c => c.name).join(", ") ?? "N/A";
    const totalNulls = (meta.totalNullCount as number)?.toLocaleString() ?? "N/A";
    return `<p style="margin: 0; color: #4b5563; font-size: 14px;">Columns: ${columns} (${totalNulls} nulls)</p>`;
  }

  if (alert.alertType === "SCHEMA_CHANGE") {
    const summary = meta.summary as { addedCount?: number; removedCount?: number; typeChangedCount?: number } | undefined;
    const parts = [];
    if (summary?.addedCount) parts.push(`${summary.addedCount} added`);
    if (summary?.removedCount) parts.push(`${summary.removedCount} removed`);
    if (summary?.typeChangedCount) parts.push(`${summary.typeChangedCount} type changed`);
    return `<p style="margin: 0; color: #4b5563; font-size: 14px;">${parts.join(", ") || "Schema modified"}</p>`;
  }

  return "";
}

function generateBatchAlertText(payload: BatchAlertNotificationPayload): string {
  const alertCount = payload.alerts.length;
  const alertItemsText = payload.alerts.map(alert => generateAlertItemText(alert)).join("\n");

  return `
DAG Run Alert Summary

${alertCount} alert${alertCount > 1 ? "s" : ""} triggered during this run.

Run Details:
DAG: ${payload.dagId}
${payload.srcRunId ? `Run ID: ${payload.srcRunId}\n` : ""}${payload.environment ? `Environment: ${payload.environment}\n` : ""}Alerts Triggered: ${alertCount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${alertItemsText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${payload.dashboardUrl ? `View Run in Dashboard: ${payload.dashboardUrl}` : ""}

---
You received this email because you're subscribed to Granyt alerts.
Manage your notification preferences in the dashboard settings.
`.trim();
}

function generateAlertItemText(alert: BatchAlertItem): string {
  const display = ALERT_TYPE_DISPLAY[alert.alertType] || { label: alert.alertType, icon: "⚠️" };
  const severityIcon = alert.severity === "critical" ? "🔴" : "⚠️";
  const metadataText = generateAlertMetadataText(alert);

  return `${severityIcon} ${display.label} (${alert.severity})
${alert.captureId ? `Capture Point: ${alert.captureId}\n` : ""}${metadataText}
`;
}

function generateAlertMetadataText(alert: BatchAlertItem): string {
  const meta = alert.metadata;

  if (alert.alertType === "ROW_COUNT_DROP") {
    const baseline = (meta.baseline as number)?.toLocaleString() ?? "N/A";
    const current = (meta.current as number)?.toLocaleString() ?? "N/A";
    const dropPct = (meta.dropPercentage as number)?.toFixed(1) ?? "N/A";
    return `${baseline} → ${current} (${dropPct}% drop)`;
  }

  if (alert.alertType === "NULL_OCCURRENCE") {
    const columns = (meta.affectedColumns as Array<{ name: string }>)?.map(c => c.name).join(", ") ?? "N/A";
    const totalNulls = (meta.totalNullCount as number)?.toLocaleString() ?? "N/A";
    return `Columns: ${columns} (${totalNulls} nulls)`;
  }

  if (alert.alertType === "SCHEMA_CHANGE") {
    const summary = meta.summary as { addedCount?: number; removedCount?: number; typeChangedCount?: number } | undefined;
    const parts = [];
    if (summary?.addedCount) parts.push(`${summary.addedCount} added`);
    if (summary?.removedCount) parts.push(`${summary.removedCount} removed`);
    if (summary?.typeChangedCount) parts.push(`${summary.typeChangedCount} type changed`);
    return parts.join(", ") || "Schema modified";
  }

  return "";
}

// ============================================================================
// ERROR TEMPLATES
// ============================================================================

function generateErrorHtml(payload: ErrorNotificationPayload, isNew: boolean): string {
  const colors = SEVERITY_COLORS.critical;

  return `
    <div style="${BASE_STYLES}">
      <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; color: ${colors.text};">🚨 ${isNew ? "New " : ""}DAG Error</h2>
        <p style="margin: 0; color: #4b5563;">An error occurred in your DAG.</p>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827;">Error Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #6b7280;">Error Type</td><td style="padding: 8px; font-weight: 500; color: ${colors.text};">${payload.errorType}</td></tr>
          ${payload.dagId ? `<tr><td style="padding: 8px; color: #6b7280;">DAG</td><td style="padding: 8px; font-weight: 500;">${payload.dagId}</td></tr>` : ""}
          ${payload.taskId ? `<tr><td style="padding: 8px; color: #6b7280;">Task</td><td style="padding: 8px; font-weight: 500;">${payload.taskId}</td></tr>` : ""}
          ${payload.runId ? `<tr><td style="padding: 8px; color: #6b7280;">Run ID</td><td style="padding: 8px; font-weight: 500;">${payload.runId}</td></tr>` : ""}
        </table>
      </div>

      <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; color: #dc2626;">Error Message</h4>
        <p style="margin: 0; font-family: monospace; font-size: 14px; color: #4b5563; white-space: pre-wrap; word-break: break-word;">${escapeHtml(payload.errorMessage)}</p>
      </div>

      ${payload.stackTrace ? `
        <details style="margin-bottom: 24px;">
          <summary style="cursor: pointer; color: #6b7280; font-weight: 500;">Stack Trace</summary>
          <pre style="background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin-top: 8px;">${escapeHtml(payload.stackTrace)}</pre>
        </details>
      ` : ""}

      ${payload.dashboardUrl ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${payload.dashboardUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View in Dashboard
          </a>
        </div>
      ` : ""}

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        You received this email because you're subscribed to Granyt error notifications.<br>
        Manage your notification preferences in the dashboard settings.
      </p>
    </div>
  `;
}

function generateErrorText(payload: ErrorNotificationPayload, isNew: boolean): string {
  return `
${isNew ? "New " : ""}DAG Error

An error occurred in your DAG.

Error Details:
Error Type: ${payload.errorType}
${payload.dagId ? `DAG: ${payload.dagId}\n` : ""}${payload.taskId ? `Task: ${payload.taskId}\n` : ""}${payload.runId ? `Run ID: ${payload.runId}\n` : ""}
Error Message:
${payload.errorMessage}

${payload.stackTrace ? `Stack Trace:\n${payload.stackTrace}\n` : ""}
${payload.dashboardUrl ? `View in Dashboard: ${payload.dashboardUrl}` : ""}

---
You received this email because you're subscribed to Granyt error notifications.
Manage your notification preferences in the dashboard settings.
`.trim();
}

// ============================================================================
// HELPERS
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
