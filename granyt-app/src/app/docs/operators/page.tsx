import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Zap,
  Layers,
  Database,
  HardDrive,
  PlusCircle,
  FileCode,
  Github,
  ExternalLink,
} from "lucide-react"
import {
  PageHeader,
  CodeBlock,
  Callout,
  InfoSection,
  StepList,
  InlineCode,
} from "../_components"

export const metadata = {
  title: "Automatic Operator Tracking",
  description: "Learn how Granyt automatically captures metrics from your Airflow operators.",
}

export default function OperatorsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Zap}
        title="Automatic Operator Tracking"
        description="Granyt automatically hooks into supported Airflow operators to gather metrics without you writing a single line of extra code."
      />

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt uses a listener-based architecture to automatically detect supported operators and extract relevant metrics from their execution state and XComs. This allows you to get deep visibility into your pipelines without modifying your DAG code.
        </p>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/docs/operators/sql">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <Database className="h-8 w-8 text-primary mb-2" />
                <CardTitle>SQL & Warehouses</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Snowflake, BigQuery, Redshift, and Postgres.
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/operators/storage">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <HardDrive className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Cloud Storage</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                AWS S3, Google Cloud Storage, and Azure Blob.
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/operators/transformation">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Transformation</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                dbt Cloud, dbt Core, Spark, and Bash.
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Operator Adapters */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Operator Adapters</h2>
        </div>
        <p className="text-muted-foreground">
          Operator Adapters allow Granyt to understand the internal state of different Airflow operators and extract rich metadata like row counts, query IDs, and more.
        </p>

        <InfoSection
          title="How It Works"
          description="The system uses a registry-based architecture to match running tasks with the right extraction logic."
        >
          <StepList
            steps={[
              {
                title: "Detection",
                content: "When a task succeeds, Granyt inspects the operator's class name (e.g., SnowflakeOperator)."
              },
              {
                title: "Matching",
                content: "It searches the internal registry for an adapter that matches the operator pattern."
              },
              {
                title: "Extraction",
                content: "The matching adapter pulls metrics from the task instance, operator attributes, and XComs."
              },
              {
                title: "Reporting",
                content: "The standardized metrics object is sent to the Granyt backend for visualization."
              }
            ]}
          />
        </InfoSection>

        <InfoSection
          title="Creating a Custom Adapter"
          description="You can build your own adapter for custom operators in 3 easy steps."
        >
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileCode className="h-5 w-5 text-primary" />
                1. Inherit from OperatorAdapter
              </h3>
              <p className="text-muted-foreground mb-4">
                Create a class that defines which operators it handles and how to extract the metrics.
              </p>
              <CodeBlock
                language="python"
                code={`from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

class MyCustomAdapter(OperatorAdapter):
    # Match these operator class names
    OPERATOR_PATTERNS = ["MyCustomOperator"]
    OPERATOR_TYPE = "my_custom"
    PRIORITY = 5
    
    def extract_metrics(self, task_instance, task=None) -> OperatorMetrics:
        task = task or self._get_task(task_instance)
        
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
        )
        
        if task and hasattr(task, "custom_row_count"):
            metrics.rows_affected = task.custom_row_count
            
        return metrics`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                2. Register the Adapter
              </h3>
              <p className="text-muted-foreground mb-4">
                Tell the SDK to use your new adapter.
              </p>
              <CodeBlock
                language="python"
                code={`from granyt_sdk.integrations.airflow.operator_adapters import register_adapter

register_adapter(MyCustomAdapter)`}
              />
            </div>

            <Callout variant="warning">
              Make sure the registration code runs during Airflow startup. Putting it in an Airflow Plugin or <InlineCode>airflow_local_settings.py</InlineCode> is recommended.
            </Callout>
          </div>
        </InfoSection>

        <InfoSection
          title="Contribute Your Adapters"
          description="Built an adapter for a new operator? Share it with the community!"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Github className="h-5 w-5" />
                Open a Pull Request
              </h3>
              <p className="text-sm text-muted-foreground">
                We&apos;re always looking to expand our library of supported operators. If you&apos;ve built an adapter for a common Airflow operator, please consider contributing it back to the Granyt SDK.
              </p>
            </div>
            <Button asChild variant="default">
              <Link href="https://github.com/granyt-ai/granyt-sdk" target="_blank">
                View on GitHub
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </InfoSection>
      </section>
    </div>
  )
}
