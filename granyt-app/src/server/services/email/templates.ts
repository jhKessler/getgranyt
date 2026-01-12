import type { AlertEmailParams, ErrorEmailParams } from "./types";
import { env } from "@/env";

// Brand colors
const BRAND = {
  primary: "#0f172a",    // Slate 900 - dark text
  secondary: "#475569",  // Slate 600 - muted text
  muted: "#94a3b8",      // Slate 400 - subtle text
  accent: "#0ea5e9",     // Sky 500 - brand cyan
  accentDark: "#0284c7", // Sky 600 - hover state
  background: "#f8fafc", // Slate 50 - page background
  cardBg: "#ffffff",     // White - card background
  border: "#e2e8f0",     // Slate 200 - borders
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  critical: {
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    icon: "&#9888;",  // Warning symbol
    label: "Critical"
  },
  warning: {
    bg: "#fefce8",
    text: "#ca8a04",
    border: "#fef08a",
    icon: "&#9888;",
    label: "Warning"
  },
  info: {
    bg: "#f0f9ff",
    text: "#0369a1",
    border: "#bae6fd",
    icon: "&#8505;",  // Info symbol
    label: "Info"
  },
};

const ALERT_TYPE_CONFIG: Record<string, { label: string; description: string }> = {
  ROW_COUNT_DROP: {
    label: "Row Count Drop",
    description: "A significant decrease in row count has been detected"
  },
  NULL_OCCURRENCE: {
    label: "Null Values Detected",
    description: "Unexpected null values have been found in your data"
  },
  SCHEMA_CHANGE: {
    label: "Schema Change",
    description: "Your data schema has been modified"
  },
};

function getAppUrl(): string {
  return env.NEXT_PUBLIC_APP_URL || "https://granyt.dev";
}

function getLogoUrl(): string {
  return `${getAppUrl()}/logo.png`;
}

/**
 * Base email wrapper with header and footer
 */
function wrapEmail(content: string, preheader?: string): string {
  const appUrl = getAppUrl();
  const logoUrl = getLogoUrl();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Granyt Notification</title>
  ${preheader ? `<span style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">${preheader}</span>` : ""}
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${BRAND.primary};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.background};">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <a href="${appUrl}" style="text-decoration: none;">
                      <img src="${logoUrl}" alt="Granyt" width="120" style="display: block; border: 0; max-width: 120px; height: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.cardBg}; border-radius: 12px; border: 1px solid ${BRAND.border}; overflow: hidden;">
                <tr>
                  <td style="padding: 32px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 0 0 16px 0;">
                    <p style="margin: 0; font-size: 13px; color: ${BRAND.muted};">
                      You received this email because you're subscribed to Granyt notifications.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <a href="${appUrl}/settings/notifications" style="font-size: 13px; color: ${BRAND.accent}; text-decoration: none;">Manage notification preferences</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Creates a styled data row for tables
 */
function createDataRow(label: string, value: string, highlight?: boolean, highlightColor?: string): string {
  const valueStyle = highlight
    ? `font-weight: 600; color: ${highlightColor || BRAND.accent};`
    : `font-weight: 500; color: ${BRAND.primary};`;

  return `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid ${BRAND.border}; color: ${BRAND.secondary}; font-size: 14px; width: 40%;">${label}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid ${BRAND.border}; font-size: 14px; ${valueStyle}">${value}</td>
    </tr>
  `;
}

/**
 * Creates a call-to-action button
 */
function createButton(text: string, url: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="border-radius: 8px; background-color: ${BRAND.accent};">
          <a href="${url}" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generates HTML email content for an alert notification
 */
export function generateAlertEmailHtml(params: AlertEmailParams): string {
  const severity = SEVERITY_STYLES[params.severity] || SEVERITY_STYLES.warning;
  const alertConfig = ALERT_TYPE_CONFIG[params.alertType] || {
    label: params.alertType,
    description: "An alert has been triggered"
  };

  let metadataRows = "";

  if (params.alertType === "ROW_COUNT_DROP") {
    const meta = params.metadata as {
      baseline?: number;
      current?: number;
      dropPercentage?: number;
    };
    metadataRows = `
      ${createDataRow("Previous Count", meta.baseline?.toLocaleString() ?? "N/A")}
      ${createDataRow("Current Count", meta.current?.toLocaleString() ?? "N/A")}
      ${createDataRow("Drop", `${meta.dropPercentage?.toFixed(1) ?? "N/A"}%`, true, severity.text)}
    `;
  } else if (params.alertType === "NULL_OCCURRENCE") {
    const meta = params.metadata as {
      affectedColumns?: Array<{ name: string; nullCount: number; dtype: string }>;
      columnCount?: number;
      totalNullCount?: number;
      historicalOccurrencesAnalyzed?: number;
    };
    const columnNames = meta.affectedColumns?.map(c => c.name).join(", ") ?? "N/A";
    metadataRows = `
      ${createDataRow("Affected Columns", String(meta.columnCount ?? meta.affectedColumns?.length ?? "N/A"))}
      ${createDataRow("Column Names", columnNames)}
      ${createDataRow("Total Nulls", meta.totalNullCount?.toLocaleString() ?? "N/A", true, severity.text)}
      ${createDataRow("Runs Analyzed", String(meta.historicalOccurrencesAnalyzed ?? "N/A"))}
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
    if (meta.summary?.typeChangedCount) changesSummary.push(`${meta.summary.typeChangedCount} modified`);
    const changesText = changesSummary.length > 0 ? changesSummary.join(", ") : "N/A";

    const affectedColumns = [
      ...(meta.addedColumns?.map(c => c.name) ?? []),
      ...(meta.removedColumns?.map(c => c.name) ?? []),
      ...(meta.typeChangedColumns?.map(c => c.name) ?? []),
    ].join(", ") || "N/A";

    metadataRows = `
      ${createDataRow("Total Changes", String(meta.summary?.totalChanges ?? "N/A"), true, severity.text)}
      ${createDataRow("Summary", changesText)}
      ${createDataRow("Affected Columns", affectedColumns)}
    `;
  }

  const preheader = `${severity.label} Alert: ${alertConfig.label} detected in ${params.dagId}`;

  const content = `
    <!-- Alert Badge -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background-color: ${severity.bg}; border: 1px solid ${severity.border}; border-radius: 20px; padding: 6px 14px;">
                <span style="font-size: 13px; font-weight: 600; color: ${severity.text};">${severity.label}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Title -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${BRAND.primary}; line-height: 1.3;">
      ${alertConfig.label}
    </h1>
    <p style="margin: 0 0 32px 0; font-size: 16px; color: ${BRAND.secondary}; line-height: 1.5;">
      ${alertConfig.description}
    </p>

    <!-- Details Table -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.background}; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
      <tr>
        <td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            ${createDataRow("DAG", params.dagId)}
            ${params.captureId ? createDataRow("Capture Point", params.captureId) : ""}
            ${metadataRows}
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    ${params.dashboardUrl ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="text-align: center;">
            ${createButton("View Details", params.dashboardUrl)}
          </td>
        </tr>
      </table>
    ` : ""}
  `;

  return wrapEmail(content, preheader);
}

/**
 * Generates plain text email content for an alert notification
 */
export function generateAlertEmailText(params: AlertEmailParams): string {
  const alertConfig = ALERT_TYPE_CONFIG[params.alertType] || {
    label: params.alertType,
    description: "An alert has been triggered"
  };
  const severity = SEVERITY_STYLES[params.severity] || SEVERITY_STYLES.warning;

  let metadataText = "";

  if (params.alertType === "ROW_COUNT_DROP") {
    const meta = params.metadata as {
      baseline?: number;
      current?: number;
      dropPercentage?: number;
    };
    metadataText = `
Previous Count: ${meta.baseline?.toLocaleString() ?? "N/A"}
Current Count: ${meta.current?.toLocaleString() ?? "N/A"}
Drop: ${meta.dropPercentage?.toFixed(1) ?? "N/A"}%`;
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
Total Nulls: ${meta.totalNullCount?.toLocaleString() ?? "N/A"}
Runs Analyzed: ${meta.historicalOccurrencesAnalyzed ?? "N/A"}`;
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
    if (meta.summary?.typeChangedCount) changesSummary.push(`${meta.summary.typeChangedCount} modified`);
    const changesText = changesSummary.length > 0 ? changesSummary.join(", ") : "N/A";

    const affectedColumns = [
      ...(meta.addedColumns?.map(c => c.name) ?? []),
      ...(meta.removedColumns?.map(c => c.name) ?? []),
      ...(meta.typeChangedColumns?.map(c => c.name) ?? []),
    ].join(", ") || "N/A";

    metadataText = `
Total Changes: ${meta.summary?.totalChanges ?? "N/A"}
Summary: ${changesText}
Affected Columns: ${affectedColumns}`;
  }

  const appUrl = getAppUrl();

  return `
GRANYT | ${severity.label.toUpperCase()} ALERT
${"=".repeat(50)}

${alertConfig.label}
${alertConfig.description}

DETAILS
${"-".repeat(30)}
DAG: ${params.dagId}${params.captureId ? `\nCapture Point: ${params.captureId}` : ""}${metadataText}

${params.dashboardUrl ? `View in Dashboard:\n${params.dashboardUrl}` : ""}

${"=".repeat(50)}
You received this email because you're subscribed to Granyt notifications.
Manage preferences: ${appUrl}/settings/notifications
`.trim();
}

/**
 * Generates HTML email content for an error notification
 */
export function generateErrorEmailHtml(params: ErrorEmailParams): string {
  const severity = SEVERITY_STYLES.critical;
  const isNew = params.isNewError;

  const preheader = `Error in ${params.dagId || "your pipeline"}: ${params.errorType}`;

  // Escape HTML in error message to prevent XSS and display issues
  const escapedErrorMessage = params.errorMessage
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const escapedStackTrace = params.stackTrace
    ? params.stackTrace
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    : "";

  const content = `
    <!-- Error Badge -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background-color: ${severity.bg}; border: 1px solid ${severity.border}; border-radius: 20px; padding: 6px 14px;">
                <span style="font-size: 13px; font-weight: 600; color: ${severity.text};">${isNew ? "New Error" : "Error"}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Title -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${BRAND.primary}; line-height: 1.3;">
      Pipeline Error Detected
    </h1>
    <p style="margin: 0 0 32px 0; font-size: 16px; color: ${BRAND.secondary}; line-height: 1.5;">
      An error occurred while running your data pipeline
    </p>

    <!-- Details Table -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.background}; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
      <tr>
        <td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            ${createDataRow("Error Type", params.errorType, true, severity.text)}
            ${params.dagId ? createDataRow("DAG", params.dagId) : ""}
            ${params.taskId ? createDataRow("Task", params.taskId) : ""}
            ${params.runId ? createDataRow("Run ID", params.runId) : ""}
          </table>
        </td>
      </tr>
    </table>

    <!-- Error Message Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: ${severity.bg}; border: 1px solid ${severity.border}; border-radius: 8px; padding: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: ${severity.text}; text-transform: uppercase; letter-spacing: 0.5px;">Error Message</p>
          <p style="margin: 0; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace; font-size: 13px; color: ${BRAND.primary}; white-space: pre-wrap; word-break: break-word; line-height: 1.6;">${escapedErrorMessage}</p>
        </td>
      </tr>
    </table>

    ${escapedStackTrace ? `
    <!-- Stack Trace -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
      <tr>
        <td>
          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: ${BRAND.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">Stack Trace</p>
          <div style="background-color: #1e293b; border-radius: 8px; padding: 16px; overflow-x: auto;">
            <pre style="margin: 0; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace; font-size: 12px; color: #e2e8f0; white-space: pre-wrap; word-break: break-word; line-height: 1.5;">${escapedStackTrace}</pre>
          </div>
        </td>
      </tr>
    </table>
    ` : ""}

    <!-- CTA Button -->
    ${params.dashboardUrl ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="text-align: center;">
            ${createButton("View in Dashboard", params.dashboardUrl)}
          </td>
        </tr>
      </table>
    ` : ""}
  `;

  return wrapEmail(content, preheader);
}

/**
 * Generates plain text email content for an error notification
 */
export function generateErrorEmailText(params: ErrorEmailParams): string {
  const appUrl = getAppUrl();
  const errorLabel = params.isNewError ? "NEW ERROR" : "ERROR";

  return `
GRANYT | ${errorLabel}
${"=".repeat(50)}

Pipeline Error Detected
An error occurred while running your data pipeline

DETAILS
${"-".repeat(30)}
Error Type: ${params.errorType}${params.dagId ? `\nDAG: ${params.dagId}` : ""}${params.taskId ? `\nTask: ${params.taskId}` : ""}${params.runId ? `\nRun ID: ${params.runId}` : ""}

ERROR MESSAGE
${"-".repeat(30)}
${params.errorMessage}

${params.stackTrace ? `STACK TRACE\n${"-".repeat(30)}\n${params.stackTrace}\n` : ""}
${params.dashboardUrl ? `View in Dashboard:\n${params.dashboardUrl}` : ""}

${"=".repeat(50)}
You received this email because you're subscribed to Granyt notifications.
Manage preferences: ${appUrl}/settings/notifications
`.trim();
}
