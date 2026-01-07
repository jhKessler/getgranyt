import { Settings, Database, Mail, Webhook, Zap, Lock, Globe } from "lucide-react"
import {
  PageHeader,
  SectionHeader,
  EnvVarTable,
  InfoSection,
  CodeBlock,
  Callout,
} from "../../_components"

export const metadata = {
  title: "Server Environment Variables",
  description: "Configure the Granyt server using environment variables",
}

const coreEnvVars = [
  {
    variable: "DATABASE_URL",
    description: "PostgreSQL connection string (e.g., postgresql://user:password@host:5432/granyt)",
  },
  {
    variable: "BETTER_AUTH_SECRET",
    description: "Secret key for authentication (minimum 16 characters). Generate with: openssl rand -base64 32",
  },
  {
    variable: "BETTER_AUTH_URL",
    default: "http://localhost:3000",
    description: "The URL where the Granyt server is hosted. Used for auth callbacks.",
  },
]

const deploymentEnvVars = [
  {
    variable: "NODE_ENV",
    default: "development",
    description: "Environment mode: development, production, or test.",
  },
  {
    variable: "PORT",
    default: "3000",
    description: "The port the application listens on.",
  },
  {
    variable: "LOG_LEVEL",
    default: "info",
    description: "Pino log level: trace, debug, info, warn, error, or fatal.",
  },
  {
    variable: "GRANYT_MODE",
    default: "DEV",
    description: "App mode: APP (dashboard only), DOCS (documentation only), or DEV (both).",
  },
]

const clientEnvVars = [
  {
    variable: "NEXT_PUBLIC_APP_URL",
    description: "Public URL for the dashboard, used in email links and notifications.",
  },
  {
    variable: "NEXT_PUBLIC_GRANYT_MODE",
    description: "Client-side app mode: APP, DOCS, or DEV.",
  },
  {
    variable: "NEXT_PUBLIC_DOCS_URL",
    default: "/docs",
    description: "Base URL for documentation links.",
  },
  {
    variable: "NEXT_PUBLIC_GITHUB_URL",
    description: "GitHub repository URL for documentation links.",
  },
]

const smtpEnvVars = [
  {
    variable: "SMTP_HOST",
    description: "SMTP server hostname (e.g., smtp.gmail.com).",
  },
  {
    variable: "SMTP_PORT",
    description: "SMTP server port (usually 587 for TLS or 465 for SSL).",
  },
  {
    variable: "SMTP_USER",
    description: "SMTP authentication username.",
  },
  {
    variable: "SMTP_PASSWORD",
    description: "SMTP authentication password.",
  },
  {
    variable: "SMTP_FROM_EMAIL",
    description: "Sender email address for outgoing emails.",
  },
  {
    variable: "SMTP_FROM_NAME",
    description: "Sender display name for outgoing emails.",
  },
  {
    variable: "SMTP_SECURE",
    default: "false",
    description: "Use TLS/SSL for SMTP connection (true or false).",
  },
]

const resendEnvVars = [
  {
    variable: "GRANYT_RESEND_API_KEY",
    description: "Resend API key for email delivery.",
  },
  {
    variable: "RESEND_FROM_EMAIL",
    description: "Sender email address for Resend.",
  },
  {
    variable: "RESEND_FROM_NAME",
    description: "Sender display name for Resend.",
  },
]

const webhookEnvVars = [
  {
    variable: "GRANYT_WEBHOOK_URL",
    description: "Default webhook endpoint URL for alert notifications.",
  },
  {
    variable: "GRANYT_WEBHOOK_SECRET",
    description: "Secret key for signing webhook payloads (HMAC-SHA256).",
  },
]

const analyticsEnvVars = [
  {
    variable: "NEXT_PUBLIC_POSTHOG_KEY",
    description: "PostHog analytics API key (optional).",
  },
  {
    variable: "NEXT_PUBLIC_POSTHOG_HOST",
    description: "PostHog host URL (optional).",
  },
]

const EXAMPLE_ENV = `# Core (Required)
DATABASE_URL=postgresql://granyt:password@localhost:5432/granyt?schema=public
BETTER_AUTH_SECRET=your-32-character-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Deployment
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
GRANYT_MODE=APP

# Email (SMTP) - Optional
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=alerts@yourdomain.com
SMTP_FROM_NAME=Granyt Alerts

# Webhooks - Optional
GRANYT_WEBHOOK_URL=https://hooks.slack.com/services/xxx
GRANYT_WEBHOOK_SECRET=your-webhook-signing-secret`

export default function ServerEnvironmentVariablesPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Settings}
        title="Server Environment Variables"
        description="Configure the Granyt server using environment variables. These control database connections, authentication, email notifications, and more."
      />

      <Callout variant="info">
        Set <code className="text-xs">SKIP_ENV_VALIDATION=1</code> during Docker builds to skip environment variable validation at build time.
      </Callout>

      <section className="space-y-6">
        <SectionHeader icon={Database} title="Core Configuration" />
        <p className="text-muted-foreground">
          These are the essential variables required to run the Granyt server.
        </p>
        <EnvVarTable
          envVars={coreEnvVars}
          badgeVariant="destructive"
        />
      </section>

      <section className="space-y-6">
        <SectionHeader icon={Zap} title="Deployment" />
        <p className="text-muted-foreground">
          Control how the server runs in different environments.
        </p>
        <EnvVarTable
          envVars={deploymentEnvVars}
          badgeVariant="secondary"
          showDefault
        />
      </section>

      <section className="space-y-6">
        <SectionHeader icon={Globe} title="Client Configuration" />
        <p className="text-muted-foreground">
          Variables prefixed with <code className="text-xs">NEXT_PUBLIC_</code> are exposed to the browser.
        </p>
        <EnvVarTable
          envVars={clientEnvVars}
          badgeVariant="outline"
        />
      </section>

      <section className="space-y-6">
        <SectionHeader icon={Mail} title="Email via SMTP" />
        <p className="text-muted-foreground">
          Configure SMTP for sending alert notifications via email. All SMTP variables are optional.
        </p>
        <EnvVarTable
          envVars={smtpEnvVars}
          badgeVariant="outline"
        />
      </section>

      <section className="space-y-6">
        <SectionHeader icon={Mail} title="Email via Resend" />
        <p className="text-muted-foreground">
          Alternative email delivery using the Resend API. Use this if you prefer a managed email service.
        </p>
        <EnvVarTable
          envVars={resendEnvVars}
          badgeVariant="outline"
        />
      </section>

      <section className="space-y-6">
        <SectionHeader icon={Webhook} title="Webhooks" />
        <p className="text-muted-foreground">
          Configure default webhook settings for alert notifications.
        </p>
        <EnvVarTable
          envVars={webhookEnvVars}
          badgeVariant="outline"
        />
      </section>

      <section className="space-y-6">
        <SectionHeader icon={Lock} title="Analytics (Optional)" />
        <p className="text-muted-foreground">
          Optional PostHog integration for usage analytics.
        </p>
        <EnvVarTable
          envVars={analyticsEnvVars}
          badgeVariant="outline"
        />
      </section>

      <InfoSection
        title="Example .env File"
        description="Here's a complete example of a production .env file:"
      >
        <div className="mt-4">
          <CodeBlock code={EXAMPLE_ENV} language="bash" title=".env" />
        </div>
      </InfoSection>

      <InfoSection
        title="Docker Deployment"
        description="When deploying with Docker Compose, set these variables in your .env file or pass them directly:"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <h4 className="font-medium">Using .env file</h4>
            <p className="text-sm text-muted-foreground">
              Create a <code className="text-xs">.env</code> file next to your <code className="text-xs">docker-compose.yml</code> and Docker will automatically load it.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Inline Variables</h4>
            <p className="text-sm text-muted-foreground">
              Set variables inline: <code className="text-xs">DATABASE_URL=... docker compose up</code>
            </p>
          </div>
        </div>
      </InfoSection>
    </div>
  )
}
