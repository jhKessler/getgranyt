/**
 * Email Preview Script
 *
 * Run with: npx tsx scripts/preview-emails.ts
 * Then open the generated HTML files in your browser.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Mock the env module
process.env.NEXT_PUBLIC_APP_URL = "https://granyt.dev";

// We need to manually implement the template functions here since we can't easily
// import them with the module resolution. This is just for preview purposes.

const BRAND = {
  primary: "#0f172a",
  secondary: "#475569",
  muted: "#94a3b8",
  accent: "#0ea5e9",
  accentDark: "#0284c7",
  background: "#f8fafc",
  cardBg: "#ffffff",
  border: "#e2e8f0",
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  critical: {
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    icon: "&#9888;",
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
    icon: "&#8505;",
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
  return "https://granyt.dev";
}

function getLogoUrl(): string {
  return `${getAppUrl()}/logo.png`;
}

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

// Generate Alert Email (Row Count Drop)
function generateRowCountDropAlert(): string {
  const severity = SEVERITY_STYLES.critical;
  const alertConfig = ALERT_TYPE_CONFIG.ROW_COUNT_DROP;

  const metadataRows = `
    ${createDataRow("Previous Count", "1,250,000")}
    ${createDataRow("Current Count", "875,000")}
    ${createDataRow("Drop", "30.0%", true, severity.text)}
  `;

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
            ${createDataRow("DAG", "etl_customer_data_daily")}
            ${createDataRow("Capture Point", "transform_customers")}
            ${metadataRows}
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="text-align: center;">
          ${createButton("View Details", "https://granyt.dev/dashboard/alerts/123")}
        </td>
      </tr>
    </table>
  `;

  return wrapEmail(content, "Critical Alert: Row Count Drop detected in etl_customer_data_daily");
}

// Generate Alert Email (Null Occurrence - Warning)
function generateNullOccurrenceAlert(): string {
  const severity = SEVERITY_STYLES.warning;
  const alertConfig = ALERT_TYPE_CONFIG.NULL_OCCURRENCE;

  const metadataRows = `
    ${createDataRow("Affected Columns", "3")}
    ${createDataRow("Column Names", "email, phone_number, address")}
    ${createDataRow("Total Nulls", "15,847", true, severity.text)}
    ${createDataRow("Runs Analyzed", "30")}
  `;

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
            ${createDataRow("DAG", "sync_user_profiles")}
            ${metadataRows}
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="text-align: center;">
          ${createButton("View Details", "https://granyt.dev/dashboard/alerts/456")}
        </td>
      </tr>
    </table>
  `;

  return wrapEmail(content, "Warning Alert: Null Values Detected in sync_user_profiles");
}

// Generate Error Email
function generateErrorEmail(): string {
  const severity = SEVERITY_STYLES.critical;

  const errorMessage = `KeyError: 'customer_id'

The column 'customer_id' was not found in the DataFrame.
Please verify the source data schema has not changed.`;

  const stackTrace = `Traceback (most recent call last):
  File "/opt/airflow/dags/etl_pipeline.py", line 142, in transform_data
    df = df.select(required_columns)
  File "/usr/local/lib/python3.9/site-packages/pandas/core/frame.py", line 3458, in __getitem__
    indexer = self.columns.get_loc(key)
  File "/usr/local/lib/python3.9/site-packages/pandas/core/indexes/base.py", line 3363, in get_loc
    raise KeyError(key)
KeyError: 'customer_id'`;

  const content = `
    <!-- Error Badge -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background-color: ${severity.bg}; border: 1px solid ${severity.border}; border-radius: 20px; padding: 6px 14px;">
                <span style="font-size: 13px; font-weight: 600; color: ${severity.text};">New Error</span>
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
            ${createDataRow("Error Type", "KeyError", true, severity.text)}
            ${createDataRow("DAG", "etl_customer_data_daily")}
            ${createDataRow("Task", "transform_customers")}
            ${createDataRow("Run ID", "scheduled__2024-01-15T00:00:00+00:00")}
          </table>
        </td>
      </tr>
    </table>

    <!-- Error Message Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: ${severity.bg}; border: 1px solid ${severity.border}; border-radius: 8px; padding: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: ${severity.text}; text-transform: uppercase; letter-spacing: 0.5px;">Error Message</p>
          <p style="margin: 0; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace; font-size: 13px; color: ${BRAND.primary}; white-space: pre-wrap; word-break: break-word; line-height: 1.6;">${errorMessage}</p>
        </td>
      </tr>
    </table>

    <!-- Stack Trace -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
      <tr>
        <td>
          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: ${BRAND.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">Stack Trace</p>
          <div style="background-color: #1e293b; border-radius: 8px; padding: 16px; overflow-x: auto;">
            <pre style="margin: 0; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace; font-size: 12px; color: #e2e8f0; white-space: pre-wrap; word-break: break-word; line-height: 1.5;">${stackTrace}</pre>
          </div>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="text-align: center;">
          ${createButton("View in Dashboard", "https://granyt.dev/dashboard/errors/789")}
        </td>
      </tr>
    </table>
  `;

  return wrapEmail(content, "Error in etl_customer_data_daily: KeyError");
}

// Generate Schema Change Alert (Info)
function generateSchemaChangeAlert(): string {
  const severity = SEVERITY_STYLES.info;
  const alertConfig = ALERT_TYPE_CONFIG.SCHEMA_CHANGE;

  const metadataRows = `
    ${createDataRow("Total Changes", "4", true, severity.text)}
    ${createDataRow("Summary", "2 added, 1 removed, 1 modified")}
    ${createDataRow("Affected Columns", "created_at, updated_at, legacy_id, status")}
  `;

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
            ${createDataRow("DAG", "ingest_orders_stream")}
            ${createDataRow("Capture Point", "raw_orders")}
            ${metadataRows}
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="text-align: center;">
          ${createButton("View Details", "https://granyt.dev/dashboard/alerts/321")}
        </td>
      </tr>
    </table>
  `;

  return wrapEmail(content, "Info: Schema Change detected in ingest_orders_stream");
}

// Main execution
const outputDir = join(process.cwd(), "email-previews");

try {
  mkdirSync(outputDir, { recursive: true });
} catch {
  // Directory may already exist
}

const previews = [
  { name: "alert-row-count-drop", html: generateRowCountDropAlert() },
  { name: "alert-null-occurrence", html: generateNullOccurrenceAlert() },
  { name: "alert-schema-change", html: generateSchemaChangeAlert() },
  { name: "error-pipeline", html: generateErrorEmail() },
];

previews.forEach(({ name, html }) => {
  const filePath = join(outputDir, `${name}.html`);
  writeFileSync(filePath, html);
  console.log(`Generated: ${filePath}`);
});

console.log(`\nOpen the HTML files in your browser to preview the emails.`);
console.log(`Location: ${outputDir}`);
