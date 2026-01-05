import { Settings, Shield, Zap, Activity, Clock } from "lucide-react"
import {
  PageHeader,
  SectionHeader,
  EnvVarTable,
  InfoSection,
} from "../../_components"

export const metadata = {
  title: "Environment Variables",
  description: "Configure the Granyt SDK using environment variables",
}

const requiredEnvVars = [
  {
    variable: "GRANYT_ENDPOINT",
    description: "Your Granyt backend URL (e.g., https://granyt.yourdomain.com)",
  },
  {
    variable: "GRANYT_API_KEY",
    description: "API key generated from the Granyt dashboard (API Keys)",
  },
]

const coreConfigVars = [
  {
    variable: "GRANYT_DISABLED",
    default: "false",
    description: "Completely disable the SDK. Useful for local development or CI/CD.",
  },
  {
    variable: "GRANYT_DEBUG",
    default: "false",
    description: "Enable verbose debug logging to stdout.",
  },
  {
    variable: "GRANYT_NAMESPACE",
    default: "airflow",
    description: "The OpenLineage namespace to use for events.",
  },
]

const performanceVars = [
  {
    variable: "GRANYT_BATCH_SIZE",
    default: "10",
    description: "Number of error events to batch before sending.",
  },
  {
    variable: "GRANYT_FLUSH_INTERVAL",
    default: "5.0",
    description: "Maximum time in seconds to wait before flushing batched events.",
  },
  {
    variable: "GRANYT_TIMEOUT",
    default: "30.0",
    description: "Timeout in seconds for API requests.",
  },
]

const retryVars = [
  {
    variable: "GRANYT_MAX_RETRIES",
    default: "3",
    description: "Maximum number of retries for failed API requests.",
  },
  {
    variable: "GRANYT_RETRY_DELAY",
    default: "1.0",
    description: "Delay in seconds between retry attempts.",
  },
]

export default function EnvironmentVariablesPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Settings}
        title="Environment Variables"
        description="The Granyt SDK is primarily configured via environment variables. This allows for easy configuration across different Airflow environments without code changes."
      />

      <section className="space-y-6">
        <SectionHeader icon={Shield} title="Required Configuration" />
        <p className="text-muted-foreground">
          These variables must be set for the SDK to function and communicate with your Granyt instance.
        </p>
        <EnvVarTable
          envVars={requiredEnvVars}
          badgeVariant="destructive"
        />
      </section>

      <section className="space-y-6">
        <SectionHeader icon={Zap} title="Core Configuration" />
        <p className="text-muted-foreground">
          General settings to control the SDK behavior and logging.
        </p>
        <EnvVarTable
          envVars={coreConfigVars}
          badgeVariant="secondary"
        />
      </section>

      <section className="space-y-6">
        <SectionHeader icon={Activity} title="Performance & Batching" />
        <p className="text-muted-foreground">
          Fine-tune how the SDK handles data and communicates with the backend.
        </p>
        <EnvVarTable
          envVars={performanceVars}
          badgeVariant="outline"
        />
      </section>

      <section className="space-y-6">
        <SectionHeader icon={Clock} title="Retry Logic" />
        <p className="text-muted-foreground">
          Configure how the SDK handles transient network failures.
        </p>
        <EnvVarTable
          envVars={retryVars}
          badgeVariant="outline"
        />
      </section>

      <InfoSection
        title="Setting Variables in Airflow"
        description="Depending on your Airflow deployment, you can set these variables in several ways:"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <h4 className="font-medium">Docker Compose</h4>
            <p className="text-sm text-muted-foreground">
              Add them to the <code className="text-xs">environment:</code> section of your Airflow worker/scheduler services.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Kubernetes</h4>
            <p className="text-sm text-muted-foreground">
              Use a <code className="text-xs">ConfigMap</code> or <code className="text-xs">Secret</code> and reference them in your pod spec.
            </p>
          </div>
        </div>
      </InfoSection>
    </div>
  )
}
