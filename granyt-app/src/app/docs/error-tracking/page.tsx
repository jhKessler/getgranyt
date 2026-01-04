import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Archive,
  Code2,
  Layers,
  FileCode,
  Clock,
  Hash,
} from "lucide-react"
import {
  PageHeader,
  StepCard,
  DataTable,
  CodeBlock,
  Callout,
  SectionCard,
  InfoSection,
  CheckList,
} from "../_components"

export const metadata = {
  title: "Error Tracking",
  description: "Rich error capture and tracking for Airflow DAGs with Granyt",
}

export default function ErrorTrackingPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={AlertTriangle}
        title="Error Tracking"
        description="Sentry-like error tracking designed specifically for Airflow DAGs. Capture full stack traces, local variables, and task context automatically."
      />

      {/* How It Works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <p className="text-muted-foreground">
          When a task fails in your Airflow DAG, the Granyt SDK automatically captures 
          comprehensive error information and sends it to your dashboard. No code changes required.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <StepCard
            number={1}
            title="Task Fails"
            description="An exception occurs in your Airflow task"
          />
          <StepCard
            number={2}
            title="SDK Captures"
            description="Full stack trace, variables, and context are captured"
          />
          <StepCard
            number={3}
            title="Dashboard Shows"
            description="View, triage, and manage errors in the web UI"
          />
        </div>
      </section>

      {/* What's Captured */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">What&apos;s Captured</h2>
        <p className="text-muted-foreground">
          Every error capture includes rich context to help you debug quickly:
        </p>

        <div className="grid gap-6">
          {/* Stack Trace */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-primary" />
                Full Stack Trace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Every frame in the stack trace, with file paths, line numbers, and function names.
              </p>
              <CodeBlock 
                language="python"
                code={`Traceback (most recent call last):
  File "/opt/airflow/dags/user_pipeline.py", line 45, in transform_users
    df['age'] = calculate_age(df['birth_date'])
  File "/opt/airflow/dags/utils.py", line 12, in calculate_age
    return (today - birth_date).days // 365
TypeError: unsupported operand type(s) for -: 'datetime.date' and 'str'`}
                variant="error"
              />
            </CardContent>
          </Card>

          {/* Local Variables */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code2 className="h-5 w-5 text-primary" />
                Local Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Variables in scope at each stack frame, helping you understand the state when the error occurred.
              </p>
              <DataTable
                headers={["Variable", "Value"]}
                rows={[
                  ["df", "<DataFrame: 10000 rows>"],
                  ["birth_date", '"1990-05-15"'],
                  ["today", "datetime.date(2024, 12, 24)"],
                ]}
                monospaceColumns={[0, 1]}
              />
              <Callout variant="success">
                Sensitive variables (passwords, tokens, keys) are automatically redacted.
              </Callout>
            </CardContent>
          </Card>

          {/* Task Context */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCode className="h-5 w-5 text-primary" />
                Task Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={["Field", "Description"]}
                rows={[
                  ["dag_id", "Which DAG the error occurred in"],
                  ["task_id", "Which task failed"],
                  ["run_id", "The specific run identifier"],
                  ["try_number", "Which retry attempt (1, 2, 3...)"],
                  ["operator", "Airflow operator type (PythonOperator, etc.)"],
                ]}
                monospaceColumns={[0]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Error Grouping */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Error Grouping</h2>
        <p className="text-muted-foreground">
          Errors are automatically grouped by their <strong>fingerprint</strong>-a combination 
          of the exception type and normalized error message. This helps you identify recurring 
          issues across multiple runs and DAGs.
        </p>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Hash className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Fingerprint Example</h3>
                <CodeBlock 
                  language="text"
                  code="TypeError:unsupported_operand_type_for_datetime.date_and_str"
                  inline
                />
                <p className="text-sm text-muted-foreground mt-3">
                  All errors with this fingerprint are grouped together, showing you the total 
                  occurrence count, affected DAGs, and first/last seen timestamps.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Error Status */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Error Status Management</h2>
        <p className="text-muted-foreground">
          Manage errors through their lifecycle with status tracking:
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Eye className="h-6 w-6 text-red-500" />
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                  Open
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Errors that need attention. Default status for new errors.
              </p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                  Resolved
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Errors that have been fixed. Will reopen if the error occurs again.
              </p>
            </CardContent>
          </Card>
          <Card className="border-muted-foreground/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <EyeOff className="h-6 w-6 text-muted-foreground" />
                <Badge variant="outline">Ignored</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Known issues you don&apos;t want to track. Hidden from default views.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Environment Tabs */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Environment-Based Views</h2>
        <p className="text-muted-foreground">
          The error tracking page has separate tabs for different environment types:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  Default Environment
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Errors from your production environment (or whichever environment is marked as default). 
                These are typically higher priority.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Badge variant="outline">Non-Default Environments</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Errors from staging, development, and other environments. 
                Useful for catching issues before they reach production.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Manual Error Capture */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Manual Error Capture</h2>
        <p className="text-muted-foreground">
          While errors are captured automatically on task failures, you can also manually 
          capture errors or messages:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock 
              language="python"
              code={`from granyt_sdk import GranytClient

client = GranytClient()

# Capture an exception manually
try:
    risky_operation()
except Exception as e:
    client.capture_exception(e, context={
        "user_id": 123,
        "operation": "data_validation"
    })

# Capture a message (warning, info, etc.)
client.capture_message(
    "Data quality check failed: 15% null values in user_email",
    level="warning"
)`}
            />
          </CardContent>
        </Card>
      </section>

      {/* Security */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Security &amp; Privacy</h2>
        <Card className="bg-muted/30">
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              The SDK automatically redacts sensitive information:
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "API keys and tokens",
                "Passwords and secrets",
                "Database connection strings",
                "AWS/Azure/GCP credentials",
                "Airflow connections",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
            <Callout variant="tip">
              Variable names containing KEY, SECRET, PASSWORD, TOKEN, CREDENTIAL, AUTH, 
              or PRIVATE are automatically redacted to <code className="text-xs">&lt;redacted&gt;</code>.
            </Callout>
          </CardContent>
        </Card>
      </section>

      {/* Error Detail View */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Error Detail View</h2>
        <p className="text-muted-foreground">
          Click on any error in the dashboard to see the full details:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard icon={Clock} title="Timeline" description="First seen, last seen, and occurrence timeline" />
          <SectionCard icon={Layers} title="Stack Trace" description="Expandable frames with local variables" />
          <SectionCard icon={FileCode} title="Task Info" description="DAG, task, run ID, and retry information" />
          <SectionCard icon={Archive} title="Occurrences" description="List of all occurrences with links to runs" />
        </div>
      </section>

      {/* Best Practices */}
      <InfoSection title="Best Practices">
        <CheckList items={[
          "Check the error dashboard daily, especially for production environment errors",
          <>Mark errors as <strong>Resolved</strong> after fixing-they&apos;ll reopen if the issue recurs</>,
          <>Use <strong>Ignored</strong> sparingly for known, acceptable errors (e.g., expected validation failures)</>,
          "Look at the occurrence count-high counts may indicate systemic issues",
          "Check non-default environment errors to catch issues before they reach production",
        ]} />
      </InfoSection>
    </div>
  )
}
