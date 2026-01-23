import { Shield, Zap, BarChart3, Mail, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { GITHUB_URL } from "@/lib/constants"
import { getDocsLink } from "@/lib/utils"
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

const DOCKER_COMPOSE_YAML = `# Quick Start:
# 1. Save this file as docker-compose.yml
# 2. Create a .env file with the required variables (see below)
# 3. Run: docker compose up -d

services:
  # PostgreSQL Database
  postgres:
    image: postgres:17-alpine
    container_name: granyt-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${POSTGRES_USER:-granyt}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
      POSTGRES_DB: \${POSTGRES_DB:-granyt}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    shm_size: 128mb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-granyt} -d \${POSTGRES_DB:-granyt}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - granyt-network

  # Database Migrations
  migrations:
    image: ghcr.io/jhkessler/granyt-app:\${GRANYT_VERSION:-latest}-migrations
    container_name: granyt-migrations
    environment:
      DATABASE_URL: postgresql://\${POSTGRES_USER:-granyt}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB:-granyt}?schema=public
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - granyt-network
    restart: "no"

  # Next.js Application
  app:
    image: ghcr.io/jhkessler/granyt-app:\${GRANYT_VERSION:-latest}
    container_name: granyt-app
    restart: unless-stopped
    ports:
      - "\${APP_PORT:-3000}:3000"
    environment:
      DATABASE_URL: postgresql://\${POSTGRES_USER:-granyt}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB:-granyt}?schema=public
      BETTER_AUTH_SECRET: \${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET is required}
      BETTER_AUTH_URL: \${BETTER_AUTH_URL:?BETTER_AUTH_URL is required}
      NEXT_PUBLIC_APP_URL: \${BETTER_AUTH_URL:?BETTER_AUTH_URL is required}
      NODE_ENV: production
      # Email Notifications (Optional)
      SMTP_HOST: \${SMTP_HOST:-}
      SMTP_PORT: \${SMTP_PORT:-587}
      SMTP_USER: \${SMTP_USER:-}
      SMTP_PASSWORD: \${SMTP_PASSWORD:-}
      SMTP_FROM_EMAIL: \${SMTP_FROM_EMAIL:-}
      SMTP_FROM_NAME: \${SMTP_FROM_NAME:-Granyt Alerts}
      SMTP_SECURE: \${SMTP_SECURE:-true}
    depends_on:
      postgres:
        condition: service_healthy
      migrations:
        condition: service_completed_successfully
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - granyt-network

volumes:
  postgres-data:
    name: granyt-postgres-data

networks:
  granyt-network:
    name: granyt-network
    driver: bridge`

const DOT_ENV_EXAMPLE = `# Required
POSTGRES_PASSWORD=your-secure-database-password    # Generate with: openssl rand -hex 32
BETTER_AUTH_SECRET=your-32-char-secret-key-here    # Generate with: openssl rand -hex 32
BETTER_AUTH_URL=https://your-domain.com            # Or http://localhost:3000 for local dev`

const K8S_SECRET = `apiVersion: v1
kind: Secret
metadata:
  name: granyt
type: Opaque
stringData:
  DATABASE_URL: "postgresql://USER:PASSWORD@DB_HOST:5432/DATABASE"
  BETTER_AUTH_SECRET: "YOUR_32_CHAR_SECRET"`

const K8S_CONFIGMAP = `apiVersion: v1
kind: ConfigMap
metadata:
  name: granyt
data:
  BETTER_AUTH_URL: "https://YOUR_INGRESS_URL"
  NEXT_PUBLIC_APP_URL: "https://YOUR_INGRESS_URL"`

const K8S_DEPLOYMENT = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: granyt-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: granyt
  template:
    metadata:
      labels:
        app: granyt
    spec:
      initContainers:
        - name: migrations
          image: ghcr.io/jhkessler/granyt-app:latest-migrations
          envFrom:
            - configMapRef:
                name: granyt
            - secretRef:
                name: granyt
      containers:
        - name: app
          image: ghcr.io/jhkessler/granyt-app:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: granyt
            - secretRef:
                name: granyt
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 40
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10`

const K8S_SERVICE = `apiVersion: v1
kind: Service
metadata:
  name: granyt-app
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3000
  selector:
    app: granyt`

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
            For production deployment instructions, see the{" "}
            <Link 
              href={`${GITHUB_URL}/blob/main/granyt-app/DEPLOYMENT.md`}
              target="_blank"
              className="text-primary hover:underline"
            >
              deployment guide
            </Link>.
          </p>

          <Tabs defaultValue="docker" className="w-full">
            <TabsList className="grid w-full max-w-100 grid-cols-2">
              <TabsTrigger value="docker">Docker (Recommended)</TabsTrigger>
              <TabsTrigger value="kubernetes">Kubernetes</TabsTrigger>
            </TabsList>
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
            <TabsContent value="kubernetes" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. PostgreSQL Database</h4>
                  <p className="text-sm text-muted-foreground">
                    Deploy PostgreSQL using your preferred method: CloudNativePG, Bitnami Helm Chart, or a managed service (RDS, Cloud SQL, Azure Database).
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">2. Create Secret</h4>
                  <CodeBlock code={K8S_SECRET} language="yaml" title="secret.yaml" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">3. Create ConfigMap</h4>
                  <CodeBlock code={K8S_CONFIGMAP} language="yaml" title="configmap.yaml" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">4. Deploy Application</h4>
                  <p className="text-sm text-muted-foreground">
                    The app requires a migrations init container that runs before the main app starts.
                  </p>
                  <CodeBlock code={K8S_DEPLOYMENT} language="yaml" title="deployment.yaml" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">5. Create Service</h4>
                  <CodeBlock code={K8S_SERVICE} language="yaml" title="service.yaml" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">6. Configure Ingress</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure ingress using your preferred method (Nginx, Traefik, Kong, cloud load balancer). Point it to the <InlineCode>granyt-app</InlineCode> service on port 80.
                  </p>
                  <Callout variant="warning">
                    The URL you expose via ingress must exactly match the values in <InlineCode>BETTER_AUTH_URL</InlineCode> and <InlineCode>NEXT_PUBLIC_APP_URL</InlineCode>. Authentication will fail if these don&apos;t match.
                  </Callout>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Callout variant="info">
            Once the server is running, go to <strong>http://localhost:3000/register</strong> and follow the instructions to generate an <strong>API Key</strong>.
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
                    Set these variables in your Airflow scheduler and workers (e.g., in your <InlineCode>docker-compose.yml</InlineCode> or Airflow configuration).
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
        <Callout variant="info">
          <strong>Supported Airflow Versions:</strong> 2.5 – 2.10. Airflow 3.0 support is coming soon.
        </Callout>
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
                Granyt supports popular Airflow operators (Snowflake, BigQuery, S3, GCS, dbt, and generic SQL) to capture row counts, query IDs, and execution metadata without any extra code.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Manual Capture
              </h4>
              <p className="text-sm text-muted-foreground">
                Use the <InlineCode>compute_df_metrics</InlineCode> helper to extract metrics from your DataFrames (Pandas, Polars) and return them via Airflow XCom.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">How Manual Metrics Work</h4>
            <p className="text-sm text-muted-foreground">
              Granyt automatically captures any dictionary returned under the <InlineCode>granyt</InlineCode> key in your task&apos;s return value. Use <InlineCode>compute_df_metrics</InlineCode> to easily generate DataFrame schema and metrics, passing the result to <InlineCode>granyt[&quot;df_metrics&quot;]</InlineCode>.
            </p>
            <CodeBlock 
              language="python"
              code={`from granyt_sdk import compute_df_metrics

@task
def my_task():
    df = pd.read_csv(...)
    return {
        "granyt": {
            "high_value_orders": (df_raw["amount"] > 1000).sum(),
            "df_metrics": compute_df_metrics(df)
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
          href={getDocsLink("/notifications")}
          icon={Mail}
          title="Setup Alerts"
          description="Get alerted by Email or Webhook when your pipelines fail or data quality drops."
        />
        <LinkCard
          href={getDocsLink("/operators")}
          icon={Zap}
          title="Operator Support"
          description="See which Airflow operators are supported for automatic metadata and row count tracking."
        />
        <LinkCard
          href={getDocsLink("/error-tracking")}
          icon={AlertTriangle}
          title="Error Tracking"
          description="Learn how Granyt captures and displays stack traces and logs for failed tasks."
        />
      </section>
    </div>
  )
}

