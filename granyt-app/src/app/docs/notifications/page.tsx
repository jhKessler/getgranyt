import { Mail } from "lucide-react"
import {
  PageHeader,
  SectionHeader,
  EnvVarTable,
  Callout,
  InfoSection,
} from "../_components"

export const metadata = {
  title: "Notification Channels",
  description: "Configure how Granyt sends alerts and notifications",
}

const smtpEnvVars = [
  {
    variable: "SMTP_HOST",
    description: "SMTP server host (e.g., smtp.gmail.com)",
  },
  {
    variable: "SMTP_PORT",
    description: "SMTP server port (e.g., 587 for TLS, 465 for SSL)",
  },
  {
    variable: "SMTP_USER",
    description: "Username for SMTP authentication",
  },
  {
    variable: "SMTP_PASSWORD",
    description: "Password for SMTP authentication",
  },
  {
    variable: "SMTP_FROM_EMAIL",
    description: "Email address to send notifications from",
  },
  {
    variable: "SMTP_FROM_NAME",
    description: "Display name for the sender (optional)",
  },
  {
    variable: "SMTP_SECURE",
    description: "Set to 'true' to use SSL/TLS (optional, defaults to true)",
  },
]

const resendEnvVars = [
  {
    variable: "GRANYT_RESEND_API_KEY",
    description: "Your Resend API key (starts with re_)",
  },
  {
    variable: "RESEND_FROM_EMAIL",
    description: "Verified email address to send from in Resend",
  },
  {
    variable: "RESEND_FROM_NAME",
    description: "Display name for the sender (optional)",
  },
]

const webhookEnvVars = [
  {
    variable: "GRANYT_WEBHOOK_URL",
    description: "The destination URL for the webhook POST requests (e.g., Slack Incoming Webhook URL)",
  },
  {
    variable: "GRANYT_WEBHOOK_SECRET",
    description: "Optional secret used to sign the request (HMAC-SHA256)",
  },
]

export default function NotificationsDocsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Mail}
        title="Notification Channels"
        badge="Configuration"
        tagline="Get alerted when things go south."
        description="Granyt supports multiple notification channels to keep you informed about your pipeline health, including Email (SMTP/Resend), Slack, and custom Webhooks."
      />

      <section className="space-y-6">
        <SectionHeader
          title="Environment Variables"
          description="Using environment variables is the recommended way to configure notification channels in production environments."
        />

        <Callout variant="tip">
          <p>
            Settings defined via environment variables will take precedence over settings 
            configured in the Dashboard UI. If environment variables are present, the 
            corresponding UI configuration will be disabled.
          </p>
        </Callout>

        <div className="space-y-8">
          <EnvVarTable
            title="SMTP Configuration"
            envVars={smtpEnvVars}
          />

          <EnvVarTable
            title="Resend Configuration"
            envVars={resendEnvVars}
          />

          <EnvVarTable
            title="Webhook & Slack Configuration"
            envVars={webhookEnvVars}
          />
        </div>
      </section>

      <InfoSection title="Slack Support">
        <p className="text-muted-foreground">
          Granyt supports Slack notifications via <strong>Incoming Webhooks</strong>. To set this up, create an Incoming Webhook in your Slack workspace and use the provided URL as your Webhook URL in Granyt.
        </p>
      </InfoSection>

      <InfoSection title="Testing Your Setup">
        <p className="text-muted-foreground">
          After configuring your notification channels, you can use the <strong>Test Connection</strong> and <strong>Send Test</strong> buttons in the Dashboard Settings to verify everything is working correctly.
        </p>
      </InfoSection>
    </div>
  )
}
