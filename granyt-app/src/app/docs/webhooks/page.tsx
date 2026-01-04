import { Webhook } from "lucide-react"
import {
  PageHeader,
  SectionHeader,
  CodeBlock,
  Callout,
  DataTable,
  ParameterCard,
} from "../_components"

export const metadata = {
  title: "Webhooks",
  description: "Learn how to integrate Granyt with your own systems using webhooks",
}

export default function WebhooksPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Webhook}
        title="Webhooks"
        badge="Integration"
        tagline="Connect Granyt to your custom workflows."
        description="Webhooks allow you to receive real-time notifications from Granyt in your own applications. When an alert is triggered or an error is detected, Granyt sends a POST request to your configured URL."
      />

      <section className="space-y-6">
        <SectionHeader
          title="Payload Format"
          description="All webhook requests are sent as JSON POST requests with the following structure."
        />

        <CodeBlock
          language="json"
          code={`{
  "event": "notification",
  "type": "PIPELINE_ERROR",
  "organizationId": "org_123",
  "severity": "critical",
  "timestamp": "2025-12-28T14:00:00.000Z",
  "subject": "Pipeline Error: daily_sales_dag",
  "text": "A new error occurred in daily_sales_dag: Database connection failed...",
  "html": "<p>A new error occurred in <strong>daily_sales_dag</strong>...</p>",
  "data": {
    "type": "PIPELINE_ERROR",
    "errorType": "DatabaseError",
    "errorMessage": "Database connection failed...",
    "dagId": "daily_sales_dag",
    "taskId": "load_data",
    "runId": "run_456",
    "severity": "critical",
    "organizationId": "org_123"
  },
  "recipients": [
    {
      "email": "alerts@example.com",
      "name": "Alerts Team"
    }
  ]
}`}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <ParameterCard
            name="event"
            type="string"
            description="The type of event. Currently always 'notification'."
          />
          <ParameterCard
            name="type"
            type="string"
            description="The specific notification type. See 'Event Types' below for valid values."
          />
          <ParameterCard
            name="organizationId"
            type="string"
            description="The ID of the organization that triggered the notification."
          />
          <ParameterCard
            name="severity"
            type="string"
            description="The severity level: 'info', 'warning', or 'critical'."
          />
          <ParameterCard
            name="timestamp"
            type="string (ISO 8601)"
            description="When the notification was generated."
          />
          <ParameterCard
            name="subject"
            type="string"
            description="A brief summary of the notification."
          />
          <ParameterCard
            name="text"
            type="string"
            description="Plain text version of the notification content."
          />
          <ParameterCard
            name="html"
            type="string"
            description="HTML version of the notification content."
          />
          <ParameterCard
            name="data"
            type="object"
            description="The raw machine-friendly payload containing all event details."
          />
          <ParameterCard
            name="recipients"
            type="array"
            description="List of intended recipients for this notification."
          />
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Event Types"
          description="The following values can appear in the 'type' field of the webhook payload."
        />

        <DataTable
          headers={["Type", "Category", "Description"]}
          rows={[
            ["ROW_COUNT_DROP_ALERT", "Alert", "Triggered when a table's row count drops significantly."],
            ["NULL_OCCURRENCE_ALERT", "Alert", "Triggered when null values are detected in a non-nullable column."],
            ["SCHEMA_CHANGE_ALERT", "Alert", "Triggered when a table schema change is detected."],
            ["PIPELINE_ERROR", "Error", "Triggered when a pipeline task fails."],
            ["NEW_PIPELINE_ERROR", "Error", "Triggered when a new type of pipeline error is first seen."],
          ]}
        />
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Event Data Structures"
          description="The 'data' field contains specific information depending on the notification type."
        />

        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Alert Notifications</h3>
            <p className="text-muted-foreground">
              Sent when a data quality alert is triggered (e.g., Row Count Drop, Null Detection).
            </p>
            <CodeBlock
              language="json"
              code={`{
  "type": "ROW_COUNT_DROP_ALERT",
  "dagId": "my_dag",
  "captureId": "cap_123",
  "severity": "warning",
  "organizationId": "org_123",
  "metadata": {
    "baseline": 1000,
    "current": 500,
    "dropPercentage": 50
  }
}`}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Error Notifications</h3>
            <p className="text-muted-foreground">
              Sent when a pipeline error is detected or a new error type appears.
            </p>
            <CodeBlock
              language="json"
              code={`{
  "type": "PIPELINE_ERROR",
  "errorType": "DatabaseError",
  "errorMessage": "Connection timeout",
  "dagId": "daily_sync",
  "taskId": "extract",
  "runId": "run_789",
  "stackTrace": "...",
  "isNewError": true,
  "severity": "critical",
  "organizationId": "org_123"
}`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Environment Variables"
          description="You can also configure a global webhook using environment variables."
        />

        <DataTable
          headers={["Variable", "Description"]}
          rows={[
            ["GRANYT_WEBHOOK_URL", "The destination URL for the webhook POST requests."],
            ["GRANYT_WEBHOOK_SECRET", "Optional secret used to sign the request (HMAC-SHA256)."],
          ]}
        />
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Security"
          description="Verify that requests are coming from Granyt using request signatures."
        />

        <p className="text-muted-foreground">
          If you configure a <strong>Webhook Secret</strong>, Granyt will include an <code>X-Granyt-Signature</code> header in every request. 
          This signature is a HMAC-SHA256 hash of the request body, signed with your secret.
        </p>

        <Callout variant="tip">
          <p className="font-medium text-foreground mb-2">Verification Example (Node.js)</p>
          <CodeBlock
            language="javascript"
            code={`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return signature === digest;
}

// In your request handler:
const signature = req.headers['x-granyt-signature'];
const isValid = verifySignature(JSON.stringify(req.body), signature, process.env.WEBHOOK_SECRET);`}
          />
        </Callout>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Headers"
          description="Standard headers included in every webhook request."
        />

        <DataTable
          headers={["Header", "Value", "Description"]}
          rows={[
            ["Content-Type", "application/json", "The request body format."],
            ["User-Agent", "Granyt-Webhook/1.0", "Identifies the request source."],
            ["X-Granyt-Signature", "sha256=...", "HMAC signature (if secret is configured)."],
          ]}
        />
      </section>
    </div>
  )
}
