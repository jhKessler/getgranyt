import type { AlertEmailParams, ErrorEmailParams } from "./types";

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
  ROW_COUNT_DROP: "Row Count Drop",
  NULL_OCCURRENCE: "Null Column Detected",
  SCHEMA_CHANGE: "Schema Change",
};

/**
 * Generates HTML email content for an alert notification
 */
export function generateAlertEmailHtml(params: AlertEmailParams): string {
  const colors = SEVERITY_COLORS[params.severity] || SEVERITY_COLORS.warning;
  const alertLabel = ALERT_TYPE_LABELS[params.alertType] || params.alertType;

  let metadataHtml = "";
  
  if (params.alertType === "ROW_COUNT_DROP") {
    const meta = params.metadata as {
      baseline?: number;
      current?: number;
      dropPercentage?: number;
    };
    metadataHtml = `
      <tr><td style="padding: 8px; color: #6b7280;">Previous Row Count</td><td style="padding: 8px; font-weight: 500;">${meta.baseline?.toLocaleString() ?? "N/A"}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Current Row Count</td><td style="padding: 8px; font-weight: 500;">${meta.current?.toLocaleString() ?? "N/A"}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Drop Percentage</td><td style="padding: 8px; font-weight: 500; color: ${colors.text};">${meta.dropPercentage?.toFixed(1) ?? "N/A"}%</td></tr>
    `;
  } else if (params.alertType === "NULL_OCCURRENCE") {
    const meta = params.metadata as {
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
  } else if (params.alertType === "SCHEMA_CHANGE") {
    const meta = params.metadata as {
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
        <p style="margin: 0; color: #4b5563;">A ${params.severity} alert has been triggered for your DAG.</p>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827;">Alert Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #6b7280;">DAG</td><td style="padding: 8px; font-weight: 500;">${params.dagId}</td></tr>
          ${params.captureId ? `<tr><td style="padding: 8px; color: #6b7280;">Capture Point</td><td style="padding: 8px; font-weight: 500;">${params.captureId}</td></tr>` : ""}
          ${metadataHtml}
        </table>
      </div>

      ${params.dashboardUrl ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.dashboardUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
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

/**
 * Generates plain text email content for an alert notification
 */
export function generateAlertEmailText(params: AlertEmailParams): string {
  const alertLabel = ALERT_TYPE_LABELS[params.alertType] || params.alertType;
  
  let metadataText = "";
  
  if (params.alertType === "ROW_COUNT_DROP") {
    const meta = params.metadata as {
      baseline?: number;
      current?: number;
      dropPercentage?: number;
    };
    metadataText = `
Previous Row Count: ${meta.baseline?.toLocaleString() ?? "N/A"}
Current Row Count: ${meta.current?.toLocaleString() ?? "N/A"}
Drop Percentage: ${meta.dropPercentage?.toFixed(1) ?? "N/A"}%`;
  } else if (params.alertType === "NULL_OCCURRENCE") {
    const meta = params.metadata as {
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
  } else if (params.alertType === "SCHEMA_CHANGE") {
    const meta = params.metadata as {
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

A ${params.severity} alert has been triggered for your DAG.

Alert Details:
DAG: ${params.dagId}
${params.captureId ? `Capture Point: ${params.captureId}\n` : ""}${metadataText}

${params.dashboardUrl ? `View in Dashboard: ${params.dashboardUrl}` : ""}

---
You received this email because you're subscribed to Granyt alerts.
Manage your notification preferences in the dashboard settings.
`.trim();
}

/**
 * Generates HTML email content for an error notification
 */
export function generateErrorEmailHtml(params: ErrorEmailParams): string {
  const colors = SEVERITY_COLORS.critical;

  return `
    <div style="${BASE_STYLES}">
      <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; color: ${colors.text};">🚨 DAG Error</h2>
        <p style="margin: 0; color: #4b5563;">An error occurred in your DAG.</p>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827;">Error Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #6b7280;">Error Type</td><td style="padding: 8px; font-weight: 500; color: ${colors.text};">${params.errorType}</td></tr>
          ${params.dagId ? `<tr><td style="padding: 8px; color: #6b7280;">DAG</td><td style="padding: 8px; font-weight: 500;">${params.dagId}</td></tr>` : ""}
          ${params.taskId ? `<tr><td style="padding: 8px; color: #6b7280;">Task</td><td style="padding: 8px; font-weight: 500;">${params.taskId}</td></tr>` : ""}
          ${params.runId ? `<tr><td style="padding: 8px; color: #6b7280;">Run ID</td><td style="padding: 8px; font-weight: 500;">${params.runId}</td></tr>` : ""}
        </table>
      </div>

      <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; color: #dc2626;">Error Message</h4>
        <p style="margin: 0; font-family: monospace; font-size: 14px; color: #4b5563; white-space: pre-wrap; word-break: break-word;">${params.errorMessage}</p>
      </div>

      ${params.stackTrace ? `
        <details style="margin-bottom: 24px;">
          <summary style="cursor: pointer; color: #6b7280; font-weight: 500;">Stack Trace</summary>
          <pre style="background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin-top: 8px;">${params.stackTrace}</pre>
        </details>
      ` : ""}

      ${params.dashboardUrl ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.dashboardUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
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

/**
 * Generates plain text email content for an error notification
 */
export function generateErrorEmailText(params: ErrorEmailParams): string {
  return `
DAG Error

An error occurred in your DAG.

Error Type: ${params.errorType}
${params.dagId ? `DAG: ${params.dagId}\n` : ""}${params.taskId ? `Task: ${params.taskId}\n` : ""}${params.runId ? `Run ID: ${params.runId}\n` : ""}
Error Message:
${params.errorMessage}

${params.stackTrace ? `Stack Trace:\n${params.stackTrace}\n` : ""}
${params.dashboardUrl ? `View in Dashboard: ${params.dashboardUrl}` : ""}

---
You received this email because you're subscribed to Granyt error notifications.
Manage your notification preferences in the dashboard settings.
`.trim();
}
