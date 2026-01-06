import { Bug, CheckCircle2 } from "lucide-react"
import {
  PageHeader,
  CodeBlock,
  Callout,
  StepCard,
} from "../../_components"

export const metadata = {
  title: "Test Error DAG",
  description: "A simple DAG to test error tracking with Granyt",
}

export default function TestErrorDagPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Bug}
        title="Test Error DAG"
        description="Verify that error tracking is working by running this simple DAG that intentionally fails. Copy it into your Airflow environment to test the Granyt SDK integration."
      />

      {/* Quick Start */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Quick Start</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StepCard
            number={1}
            title="Copy the DAG"
            description="Copy the test DAG code below into your Airflow DAGs folder"
          />
          <StepCard
            number={2}
            title="Trigger the DAG"
            description="Run the DAG from the Airflow UI or CLI"
          />
          <StepCard
            number={3}
            title="Check Granyt"
            description="See the captured error in your Granyt dashboard"
          />
        </div>
      </section>

      {/* The Test DAG */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Test DAG Code</h2>
        <p className="text-muted-foreground">
          This minimal DAG will fail with a clear error message. Save it as{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            granyt_test_error.py
          </code>{" "}
          in your DAGs folder.
        </p>

        <CodeBlock
          language="python"
          title="granyt_test_error.py"
          code={`"""
Granyt Test Error DAG
A simple DAG to verify error tracking is working correctly.
"""
from datetime import datetime
from airflow import DAG
from airflow.operators.python import PythonOperator


def task_that_fails():
    """This task intentionally raises an error to test Granyt error tracking."""
    
    # Some context variables that will be captured
    user_id = 12345
    batch_size = 100
    processing_date = datetime.now().isoformat()
    
    # Intentionally raise an error
    raise ValueError(
        f"Test error from Granyt! "
        f"Processing user {user_id} with batch size {batch_size} "
        f"on {processing_date}"
    )


with DAG(
    dag_id="granyt_test_error",
    description="Test DAG to verify Granyt error tracking",
    start_date=datetime(2024, 1, 1),
    schedule=None,  # Manual trigger only
    catchup=False,
    tags=["granyt", "test"],
) as dag:
    
    fail_task = PythonOperator(
        task_id="intentional_failure",
        python_callable=task_that_fails,
    )`}
        />

        <Callout variant="info">
          The local variables (<code>user_id</code>, <code>batch_size</code>, <code>processing_date</code>) 
          will be captured in the error details, demonstrating Granyt&apos;s rich context capture.
        </Callout>
      </section>

      {/* Running the DAG */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Running the DAG</h2>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Option 1: Airflow UI</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Navigate to the Airflow web UI</li>
            <li>Find <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">granyt_test_error</code> in the DAG list</li>
            <li>Toggle the DAG on if needed</li>
            <li>Click the &quot;Play&quot; button to trigger a run</li>
          </ol>

          <h3 className="text-lg font-semibold pt-4">Option 2: Airflow CLI</h3>
          <CodeBlock
            language="bash"
            code={`# Trigger the DAG
airflow dags trigger granyt_test_error

# Or test a specific task
airflow tasks test granyt_test_error intentional_failure 2024-01-01`}
          />
        </div>
      </section>

      {/* What to Expect */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">What to Expect</h2>
        <p className="text-muted-foreground">
          After running the DAG, you should see the error captured in your Granyt dashboard within seconds:
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Error Type
            </div>
            <code className="text-sm text-muted-foreground">ValueError</code>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Task Context
            </div>
            <code className="text-sm text-muted-foreground">
              granyt_test_error / intentional_failure
            </code>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Local Variables
            </div>
            <code className="text-sm text-muted-foreground">
              user_id, batch_size, processing_date
            </code>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Stack Trace
            </div>
            <code className="text-sm text-muted-foreground">
              Full traceback with line numbers
            </code>
          </div>
        </div>

        <Callout variant="success">
          Once you see the error in Granyt, your error tracking is working correctly! 
          You can safely delete the test DAG.
        </Callout>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Troubleshooting</h2>
        
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold">Error not appearing in Granyt?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Verify the SDK is installed: <code className="rounded bg-muted px-1 py-0.5 font-mono">pip show granyt-sdk</code></li>
              <li>Check environment variables are set: <code className="rounded bg-muted px-1 py-0.5 font-mono">GRANYT_ENDPOINT</code> and <code className="rounded bg-muted px-1 py-0.5 font-mono">GRANYT_API_KEY</code></li>
              <li>Look for SDK logs in the Airflow task logs</li>
              <li>Ensure your Airflow workers can reach your Granyt instance</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold">DAG not showing up in Airflow?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Verify the file is in the correct DAGs folder</li>
              <li>Check for Python syntax errors in the file</li>
              <li>Wait for Airflow to scan for new DAGs (or restart the scheduler)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
