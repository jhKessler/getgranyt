import { Shield, Zap, BarChart3, Mail, Settings } from "lucide-react"
import Link from "next/link"
import { INSTALL_COMMAND, GITHUB_URL } from "@/lib/constants"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PageHeader,
  StepList,
  InlineCode,
  CodeBlock,
  Callout,
  LinkCard,
  SectionHeader,
} from "./_components"

export const metadata = {
  title: "Quickstart",
  description: "Get started with Granyt - Open source data observability for Apache Airflow",
}

const DOCKER_COMPOSE_YAML = `services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: granyt
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: granyt
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U granyt -d granyt"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    image: ghcr.io/jhkessler/granyt-app:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://granyt:\${POSTGRES_PASSWORD}@postgres:5432/granyt?schema=public
      BETTER_AUTH_SECRET: \${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres-data:`

const DOT_ENV_EXAMPLE = `POSTGRES_PASSWORD=your-secure-password # Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-32-char-secret-key # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000`

export default function QuickstartPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Shield}
        title="Quickstart"
        badge="Open Source"
        tagline="Airflow Monitoring done right."
        description="Granyt is a data observability platform for Apache Airflow. It's like Sentry for your data pipelines - catching errors, tracking metrics, and visualizing lineage without you having to change your existing code."
      />

      <section className="space-y-6">
        <SectionHeader 
          title="1. Server Installation" 
          description="Deploy the Granyt backend to your infrastructure."
        />
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Choose your preferred deployment method to start the Granyt server. This will set up the dashboard and the API endpoints.
          </p>

          <Tabs defaultValue="shell" className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="shell">CLI</TabsTrigger>
              <TabsTrigger value="docker">Docker Deployment</TabsTrigger>
            </TabsList>
            <TabsContent value="shell" className="mt-4 space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The Granyt installer will walk you through the entire setup process.
                </p>
                <CodeBlock 
                  code={INSTALL_COMMAND}
                  language="bash"
                  title="Terminal"
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium">This script will:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Check for Docker (optionally install it)</li>
                    <li>
                      Download{" "}
                      <Link 
                        href={`${GITHUB_URL}/blob/main/granyt-app/docker-compose.standalone.yml`}
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        <InlineCode>docker-compose.standalone.yml</InlineCode>
                      </Link>{" "}
                      from GitHub
                    </li>
                    <li>Generate secure secrets for your installation</li>
                    <li>Create a <InlineCode>.env</InlineCode> file with your configuration</li>
                    <li>Start Granyt containers</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="docker" className="mt-4 space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create a <InlineCode>docker-compose.yml</InlineCode> file and a <InlineCode>.env</InlineCode> file, then run <InlineCode>docker compose up -d</InlineCode>.
                </p>
                <div className="space-y-4">
                  <CodeBlock 
                    code={DOCKER_COMPOSE_YAML}
                    language="yaml"
                    title="docker-compose.yml"
                  />
                  <p className="text-sm text-muted-foreground">
                    Next, create a <InlineCode>.env</InlineCode> file in the same directory to store your secrets:
                  </p>
                  <CodeBlock 
                    code={DOT_ENV_EXAMPLE}
                    language="bash"
                    title=".env"
                  />
                  <p className="text-sm text-muted-foreground">
                    Finally, start the Granyt server:
                  </p>
                  <CodeBlock 
                    code="docker compose up -d"
                    language="bash"
                    title="Terminal"
                  />
                  <p className="text-sm text-muted-foreground">
                    The Granyt server will now be available on your system at port <InlineCode>3000</InlineCode>.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Callout variant="info">
            Once the server is running, it will be available at <strong>http://localhost:3000</strong>. Open your dashboard under <strong>/register</strong> and follow the instructions to generate an <strong>API Key</strong>.
          </Callout>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader 
          title="2. SDK Installation" 
          description="Connect your Airflow environment to Granyt."
        />
        <StepList
          steps={[
            {
              title: "Install the SDK",
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Add the Granyt SDK to your Airflow environment.
                  </p>
                  <CodeBlock code="pip install granyt-sdk" language="bash" />
                </div>
              ),
            },
            {
              title: "Configure Environment Variables",
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Set these variables in your Airflow environment (e.g., in your <InlineCode>docker-compose.yml</InlineCode> or Airflow configuration).
                  </p>
                  <CodeBlock 
                    code={`export GRANYT_ENDPOINT="https://your-granyt-instance.com"\nexport GRANYT_API_KEY="your-api-key"`} 
                    language="bash" 
                  />
                </div>
              ),
            },
            {
              title: "Automatic Monitoring",
              content: (
                <p className="text-sm text-muted-foreground">
                  That&apos;s it! Granyt automatically captures DAG run statuses, task failures with full stack traces, and execution timing.
                </p>
              ),
            },
          ]}
        />
      </section>

      <section className="space-y-6">
        <SectionHeader 
          title="3. Capture Metrics" 
          description="Go beyond status codes and monitor the actual data."
        />
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Sometimes a task &quot;succeeds&quot; but the data is wrong. Granyt helps you catch silent failures like source schema changes or unexpected data drops through two main mechanisms: <strong>Automatic Operator Tracking</strong> and <strong>Manual Metric Capture</strong>.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Automatic Tracking
              </h4>
              <p className="text-sm text-muted-foreground">
                Granyt automatically hooks into supported Airflow operators (Snowflake, BigQuery, S3, GCS, dbt, and generic SQL) to capture row counts, query IDs, and execution metadata without any extra code.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Manual Capture
              </h4>
              <p className="text-sm text-muted-foreground">
                Use the <InlineCode>compute_df_metrics</InlineCode> helper to extract metrics from your DataFrames (Pandas, Polars, Spark) and return them via Airflow XCom.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">How Manual Metrics Work</h4>
            <p className="text-sm text-muted-foreground">
              Granyt automatically captures any dictionary returned under the <InlineCode>granyt_metrics</InlineCode> key in your task&apos;s return value. Use <InlineCode>compute_df_metrics</InlineCode> to easily generate this dictionary from a DataFrame.
            </p>
            <CodeBlock 
              language="python"
              code={`from granyt_sdk import compute_df_metrics

@task
def my_task():
    df = pd.read_csv(...)
    return {
        "granyt_metrics": compute_df_metrics(df)
    }`}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Example: Data Validation</h4>
            <p className="text-sm text-muted-foreground">
              Capture metrics from your final DataFrame to ensure data integrity.
            </p>
            
            <Tabs defaultValue="pandas" className="w-full">
              <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                <TabsTrigger value="pandas">Pandas</TabsTrigger>
                <TabsTrigger value="polars">Polars</TabsTrigger>
                <TabsTrigger value="spark">PySpark</TabsTrigger>
              </TabsList>
              <TabsContent value="pandas" className="mt-4">
                <CodeBlock 
                  language="python"
                  code={`from airflow.decorators import task
from granyt_sdk import compute_df_metrics
import pandas as pd

@task
def transform_data():
    # Load and transform data
    df = pd.read_sql("SELECT * FROM raw_events", conn)
    df_clean = df.dropna()
    
    # Return metrics via XCom
    return {
        "granyt_metrics": compute_df_metrics(df_clean)
    }`}
                />
              </TabsContent>
              <TabsContent value="polars" className="mt-4">
                <CodeBlock 
                  language="python"
                  code={`from airflow.decorators import task
from granyt_sdk import compute_df_metrics
import polars as pl

@task
def transform_data():
    # Load and transform data
    df = pl.read_database("SELECT * FROM raw_events", conn)
    df_clean = df.drop_nulls()
    
    # Return metrics via XCom
    return {
        "granyt_metrics": compute_df_metrics(df_clean)
    }`}
                />
              </TabsContent>
              <TabsContent value="spark" className="mt-4 space-y-4">
                <CodeBlock 
                  language="python"
                  code={`from airflow.decorators import task
from granyt_sdk import compute_df_metrics

@task
def transform_spark_data():
    # Load and transform data
    df = spark.read.table("raw_events")
    df_clean = df.filter(df.value.isNotNull())
    
    # Return metrics via XCom.
    # Setting compute_stats=True triggers a single pass over the data
    # to collect null counts and other stats efficiently.
    return {
        "granyt_metrics": compute_df_metrics(df_clean, compute_stats=True)
    }`}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Example: Custom Metrics</h4>
            <p className="text-sm text-muted-foreground">
              You can also return custom metrics directly in the <InlineCode>granyt_metrics</InlineCode> dictionary.
            </p>
            <CodeBlock 
              language="python"
              code={`from airflow.decorators import task

@task
def train_model():
    # ... training logic ...
    f1_score = 0.92
    
    return {
        "granyt_metrics": {
            "custom": {
                "f1_score": f1_score,
                "model_type": "random_forest"
            }
        }
    }`}
            />
          </div>
          
          <Callout variant="tip">
            When running inside Airflow, the SDK automatically detects the <strong>DAG ID</strong> and <strong>Task ID</strong>. You don&apos;t need to manually provide a capture ID unless you want to override this behavior.
          </Callout>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3 pt-6">
        <LinkCard
          href="/docs/notifications"
          icon={Mail}
          title="Setup Notifications"
          description="Get alerted by Email or Webhook when your pipelines fail or data quality drops."
        />
        <LinkCard
          href="/docs/metrics"
          icon={BarChart3}
          title="Full Metrics Docs"
          description="Deep dive into all the metrics and configuration options available in the SDK."
        />
        <LinkCard
          href="/docs/sdk-reference/environment-variables"
          icon={Settings}
          title="SDK Configuration"
          description="Explore all environment variables available to fine-tune the Granyt SDK."
        />
      </section>
    </div>
  )
}

