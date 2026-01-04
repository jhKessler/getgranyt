import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  BarChart3,
  Code2,
  Layers,
  Database,
  HardDrive,
  Zap,
  PlusCircle,
  FileCode,
  Github,
  ExternalLink,
} from "lucide-react"
import {
  PageHeader,
  CodeBlock,
  ParameterCard,
  Callout,
  DataTable,
  CheckList,
  InfoSection,
  StepList,
  InlineCode,
} from "../_components"

export const metadata = {
  title: "Metrics & Operators",
  description: "Capture DataFrame statistics, track data quality, and understand automatic operator tracking in Granyt.",
}

export default function MetricsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={BarChart3}
        title="Metrics & Operators"
        description="Capture DataFrame statistics, track data quality, and leverage automatic tracking for your Airflow operators."
      />

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt provides two ways to monitor your data: <strong>Automatic Operator Tracking</strong> and <strong>Manual Metric Capture</strong>. 
          Automatic tracking hooks into your existing Airflow operators to extract metadata, while manual capture lets you track specific statistics from your DataFrames.
        </p>
      </section>

      {/* Automatic Tracking */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Automatic Operator Tracking</h2>
        </div>
        <p className="text-muted-foreground">
          Granyt automatically hooks into supported Airflow operators to gather metrics without you writing a single line of extra code.
        </p>

        <Callout variant="info">
          The Granyt SDK uses a listener-based architecture to automatically detect these operators and extract relevant metrics from their execution state and XComs.
        </Callout>

        {/* SQL Operators */}
        <InfoSection
          title="SQL & Data Warehouse"
          description="Automatic tracking for query performance, data volume, and lineage across major data platforms."
        >
          <div className="grid gap-6">
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Snowflake</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports <code className="text-xs">SnowflakeOperator</code>, <code className="text-xs">SnowflakeSqlApiOperator</code>, and various Snowflake transfer operators.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["row_count", "Number of rows modified or returned by the query"],
                    ["query_id", "Snowflake Query ID for deep tracing"],
                    ["warehouse", "The Snowflake warehouse used for execution"],
                    ["database", "Target database name"],
                    ["schema", "Target schema name"],
                    ["query_duration_ms", "Total execution time in Snowflake"],
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">BigQuery</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports <code className="text-xs">BigQueryExecuteQueryOperator</code>, <code className="text-xs">BigQueryInsertJobOperator</code>, and GCS transfer operators.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["bytes_processed", "Total bytes processed by the job (billable)"],
                    ["bytes_billed", "Total bytes billed for the query"],
                    ["row_count", "Number of rows modified or returned by the job"],
                    ["query_id", "BigQuery Job ID"],
                    ["slot_milliseconds", "Total slot time consumed by the query"],
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">PostgreSQL & MySQL</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports standard Postgres and MySQL operators and hooks.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["row_count", "Number of rows modified or returned by the query"],
                    ["database", "Target database name"],
                    ["schema", "Target schema name (Postgres only)"],
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </InfoSection>

        {/* Storage Operators */}
        <InfoSection
          title="Cloud Storage"
          description="Track file transfers and data movement across cloud providers."
        >
          <div className="grid gap-6">
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">AWS S3 & Google Cloud Storage</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports S3 and GCS operators for creation, deletion, and transfer.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["files_processed", "Number of files transferred or modified"],
                    ["bytes_processed", "Total size of data transferred in bytes"],
                    ["source_path", "Source URI (e.g., s3://bucket/key or gs://bucket/obj)"],
                    ["destination_path", "Destination URI for transfer operations"],
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Azure Blob Storage</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports Azure Blob Storage operators and sensors.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["files_processed", "Number of blobs processed"],
                    ["bytes_processed", "Total size of blobs in bytes"],
                    ["source_path", "Azure WASB URI"],
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </InfoSection>

        {/* Transform Operators */}
        <InfoSection
          title="Transformation & Compute"
          description="Deep integration with modern data transformation tools."
        >
          <div className="grid gap-6">
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">dbt (data build tool)</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports all dbt operators, including Astronomer Cosmos.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["models_run", "Number of dbt models executed"],
                    ["tests_passed", "Number of dbt tests that passed"],
                    ["tests_failed", "Number of dbt tests that failed"],
                    ["row_count", "Total rows affected across all models in the run"],
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Apache Spark</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports SparkSubmit, Dataproc, EMR, and Databricks operators.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["stages_completed", "Number of Spark stages successfully completed"],
                    ["tasks_completed", "Total number of Spark tasks executed"],
                    ["shuffle_bytes", "Total bytes shuffled during the job"],
                    ["row_count", "Total records processed by the Spark application"],
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </InfoSection>
      </section>

      {/* Operator Adapters */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Operator Adapters</h2>
        </div>
        <p className="text-muted-foreground">
          Operator Adapters allow Granyt to understand the internal state of different Airflow operators and extract rich metadata like row counts, query IDs, and more without any manual code changes.
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

      {/* Manual Capture */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Manual Metric Capture</h2>
        </div>
        <p className="text-muted-foreground">
          The <InlineCode>capture_data_metrics</InlineCode> function 
          lets you capture statistics from your DataFrames at any point in your DAG. 
          Use it to track row counts, schema information, data quality metrics, and custom KPIs.
        </p>
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <CodeBlock 
              language="python"
              code={`from airflow.decorators import task
from granyt_sdk import capture_data_metrics
import pandas as pd

@task
def process_users():
    df = pd.DataFrame({
        "user_id": [1, 2, None, 4],
        "name": ["Alice", "", "Charlie", "David"],
        "score": [95.5, 87.3, 91.2, 88.8]
    })

    # Capture and send metrics. 
    # capture_id is automatically inferred from the Airflow task!
    metrics = capture_data_metrics(df)`}
            />
          </CardContent>
        </Card>

        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold">Deep Data Insights with compute_stats</h3>
          <p className="text-muted-foreground">
            By default, Granyt captures basic metadata like row and column counts to ensure minimal performance impact. 
            However, you can enable <InlineCode>compute_stats</InlineCode> to get deeper insights into your data quality.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What it does</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                It performs a deeper scan of the DataFrame to calculate:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Null counts for every column</li>
                  <li>Empty string counts for text columns</li>
                  <li>Actual memory usage in bytes</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How to enable</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="mb-3">You can enable it per-call or globally:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Per-call:</strong> Set <InlineCode>compute_stats=True</InlineCode></li>
                  <li><strong>Globally:</strong> Set the <InlineCode>GRANYT_COMPUTE_STATS=true</InlineCode> environment variable</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Callout variant="warning">
            Enabling <InlineCode>compute_stats</InlineCode> on very large DataFrames (millions of rows) 
            can increase task execution time as it requires a full pass over the data.
          </Callout>
        </div>
      </section>

      {/* Function Signature */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Function Reference</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-lg">
              <Code2 className="h-5 w-5 text-primary" />
              capture_data_metrics()
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock 
              language="python"
              code={`def capture_data_metrics(
    df: Any = None,
    capture_id: Optional[str] = None,
    compute_stats: Optional[bool] = None,
    dag_id: Optional[str] = None,
    task_id: Optional[str] = None,
    run_id: Optional[str] = None,
    upstream: Optional[List[str]] = None,
    custom_metrics: Optional[Dict[str, Union[int, float]]] = None,
    suffix: Optional[str] = None,
) -> DataFrameMetrics`}
            />
            <p className="text-sm text-muted-foreground mb-4 mt-6">
              Captures metrics from a DataFrame and sends them to the Granyt backend.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Parameters */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Parameters</h2>
        
        <ParameterCard
          name="df"
          description="The DataFrame to capture metrics from. Supports Pandas, Polars, or any custom registered type. Can be None if only custom metrics are being captured."
          type="Any"
          typeLabel="DataFrame-like object"
        />

        <ParameterCard
          name="suffix"
          description="Optional suffix to append to the auto-generated capture_id. Useful when capturing multiple DataFrames in a single task."
          type="Optional[str]"
          defaultValue="None"
        />

        <ParameterCard
          name="capture_id"
          description={<>A unique identifier for this capture point. Used to track metrics over time and link data flow. <strong>Automatically inferred</strong> from the Airflow context when running inside a task.</>}
          type="Optional[str]"
          defaultValue='{"{dag_id}.{task_id}"}'
          defaultNote="when running in Airflow, otherwise a timestamp-based ID"
          example='capture_data_metrics(df, capture_id="raw_users")'
        />

        <ParameterCard
          name="compute_stats"
          description="Whether to compute statistics like null counts, empty string counts, and memory usage. Be mindful of performance: these operations can be slow for large DataFrames."
          type="Optional[bool]"
          defaultValue="GRANYT_COMPUTE_STATS"
          defaultNote="env var (default: false)"
          example="capture_data_metrics(df, compute_stats=True)"
        >
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">When enabled, captures:</p>
            <CheckList items={[
              "Null count per column",
              "Empty string count per column",
              "Memory usage in bytes",
            ]} />
          </div>
        </ParameterCard>

        <ParameterCard
          name="dag_id, task_id, run_id"
          description={<>Lineage linkage fields. These are <strong>automatically detected</strong> when running inside an Airflow task - you typically don&apos;t need to set them manually.</>}
          type="Optional[str]"
          typeLabel="each"
          defaultValue="Auto-detected from Airflow context"
        >
          <Callout variant="tip">
            Only set these manually if you need to override the auto-detected values, 
            such as when testing outside Airflow.
          </Callout>
        </ParameterCard>

        <ParameterCard
          name="upstream"
          description="List of capture IDs that this DataFrame depends on. Use this when you have complex task dependencies and want to track data flow between transformation steps within your DAG."
          type="Optional[List[str]]"
          defaultValue="None"
        >
          <CodeBlock 
            language="python"
            code={`# Track data lineage through transformations
raw_df = load_data()
capture_data_metrics(raw_df, capture_id="raw_data")

cleaned_df = clean(raw_df)
capture_data_metrics(cleaned_df, capture_id="cleaned_data", upstream=["raw_data"])

enriched_df = enrich(cleaned_df)
capture_data_metrics(enriched_df, capture_id="enriched_data", upstream=["cleaned_data"])`}
          />
        </ParameterCard>

        <ParameterCard
          name="custom_metrics"
          description="Dictionary of custom metrics for this specific capture point. All values must be numbers (int or float). These are stored with the capture and displayed in the dashboard."
          type="Optional[Dict[str, Union[int, float]]]"
          defaultValue="None"
        >
          <CodeBlock 
            language="python"
            code={`capture_data_metrics(
    df,
    capture_id="model_predictions",
    custom_metrics={
        "accuracy": 0.95,
        "precision": 0.92,
        "recall": 0.88,
        "processed_records": 10000
    }
)`}
          />
          <Callout variant="error" className="mt-4">
            Raises <InlineCode>TypeError</InlineCode> if any value is not a number.
          </Callout>
        </ParameterCard>
      </section>

      {/* Return Value */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Return Value</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-lg">
              <Layers className="h-5 w-5 text-primary" />
              DataFrameMetrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The function returns a <InlineCode>DataFrameMetrics</InlineCode> dataclass 
              containing all captured information:
            </p>
            <DataTable
              headers={["Field", "Type", "Description"]}
              rows={[
                ["capture_id", "str", "Identifier for this capture"],
                ["captured_at", "str", "ISO timestamp"],
                ["row_count", "int", "Number of rows"],
                ["column_count", "int", "Number of columns"],
                ["columns", "List[ColumnMetrics]", "Per-column metrics"],
                ["memory_bytes", "Optional[int]", "Memory usage (if computed)"],
                ["dataframe_type", "str", '"pandas", "polars", etc.'],
                ["dag_id, task_id, run_id", "Optional[str]", "Airflow context"],
                ["upstream", "Optional[List[str]]", "Upstream capture IDs"],
                ["custom_metrics", "Optional[Dict]", "Custom metrics for this capture"],
              ]}
              monospaceColumns={[0, 1]}
            />
          </CardContent>
        </Card>
      </section>

      {/* Supported DataFrames */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported DataFrame Types</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Pandas</h3>
              <p className="text-sm text-muted-foreground">
                Full support for <InlineCode>pandas.DataFrame</InlineCode> including 
                memory usage calculation and deep null detection.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Polars</h3>
              <p className="text-sm text-muted-foreground">
                Supports both <InlineCode>polars.DataFrame</InlineCode> and{" "}
                <InlineCode>polars.LazyFrame</InlineCode>.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">PySpark</h3>
              <p className="text-sm text-muted-foreground">
                Native support for <InlineCode>pyspark.sql.DataFrame</InlineCode> using 
                the Observation API for efficient metrics.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Spark Performance */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Spark Performance & Efficiency</h2>
        <p className="text-muted-foreground">
          The Spark adapter is designed for high performance. It ensures that capturing 
          metrics doesn&apos;t slow down your production pipelines or cause redundant computations.
        </p>
        <div className="grid gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Observation API</h3>
            <p className="text-sm text-muted-foreground">
              Instead of running multiple jobs for counts and null checks, the SDK uses the 
              Spark Observation API. This calculates all statistics in a single pass over the data.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Automatic Caching</h3>
            <p className="text-sm text-muted-foreground">
              When <InlineCode>compute_stats=True</InlineCode> is used, the SDK automatically 
              calls <InlineCode>.cache()</InlineCode> on your DataFrame if it isn&apos;t already cached. 
              This ensures that the work done to calculate metrics is reused by your subsequent 
              ETL steps.
            </p>
          </div>
        </div>
      </section>

      {/* Custom Adapters */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Custom DataFrame Adapters</h2>
        <p className="text-muted-foreground">
          Add support for other DataFrame types (Dask, Ray, etc.) by creating a custom adapter:
        </p>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock 
              language="python"
              code={`from granyt_sdk import DataFrameAdapter, register_adapter
from typing import Any, Dict, List, Optional

class DaskAdapter(DataFrameAdapter):
    @classmethod
    def can_handle(cls, df: Any) -> bool:
        """Check if this is a Dask DataFrame."""
        try:
            import dask.dataframe as dd
            return isinstance(df, dd.DataFrame)
        except ImportError:
            return False
    
    @classmethod
    def get_type_name(cls) -> str:
        return "dask"
    
    @classmethod
    def get_columns_with_dtypes(cls, df: Any) -> List[tuple]:
        return [(str(col), str(dtype)) for col, dtype in zip(df.columns, df.dtypes)]
    
    @classmethod
    def get_row_count(cls, df: Any) -> int:
        return len(df) # Dask handles len()
    
    @classmethod
    def get_null_counts(cls, df: Any) -> Dict[str, int]:
        return df.isnull().sum().compute().to_dict()

# Register the adapter
register_adapter(DaskAdapter)`}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6 mt-8">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Contribute Your Adapter
            </h3>
            <p className="text-sm text-muted-foreground">
              Built an adapter for a new DataFrame type like Dask, Ray, or Vaex? We&apos;re always looking to expand our native support. Please consider opening a pull request to share your work with the community!
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="https://github.com/granyt-ai/granyt-sdk" target="_blank">
              Open Pull Request
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Complete Example */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Complete Example</h2>
        <Card>
          <CardContent className="pt-6">
            <CodeBlock 
              language="python"
              code={`from airflow import DAG
from airflow.operators.python import PythonOperator
from granyt_sdk import capture_data_metrics
import pandas as pd
from datetime import datetime

def extract_users():
    """Extract user data from source."""
    df = pd.read_csv("users.csv")
    
    # Capture raw data metrics
    capture_data_metrics(df, capture_id="raw_users")
    
    return df.to_dict()

def transform_users(**context):
    """Transform and enrich user data."""
    data = context['ti'].xcom_pull(task_ids='extract')
    df = pd.DataFrame(data)
    
    # Apply transformations
    df['full_name'] = df['first_name'] + ' ' + df['last_name']
    df['signup_date'] = pd.to_datetime(df['signup_date'])
    
    # Capture transformed data with upstream linkage
    capture_data_metrics(
        df,
        capture_id="transformed_users",
        upstream=["raw_users"],
        compute_stats=True,  # Get null counts
        custom_metrics={
            "valid_emails": int((df['email'].str.contains('@')).sum()),
            "active_users": int((df['status'] == 'active').sum())
        }
    )
    
    return df.to_dict()

def load_users(**context):
    """Load users to destination."""
    data = context['ti'].xcom_pull(task_ids='transform')
    df = pd.DataFrame(data)
    
    # Load to database...
    rows_loaded = len(df)
    
    # Capture final metrics with custom KPIs
    capture_data_metrics(
        df,
        capture_id="loaded_users",
        upstream=["transformed_users"],
        custom_metrics={
            "total_users_loaded": rows_loaded,
            "new_signups_today": int((df['signup_date'].dt.date == datetime.today().date()).sum())
        }
    )

with DAG('user_pipeline', start_date=datetime(2024, 1, 1), schedule='@daily') as dag:
    extract = PythonOperator(task_id='extract', python_callable=extract_users)
    transform = PythonOperator(task_id='transform', python_callable=transform_users)
    load = PythonOperator(task_id='load', python_callable=load_users)
    
    extract >> transform >> load`}
            />
          </CardContent>
        </Card>
      </section>

      {/* Best Practices */}
      <InfoSection title="Best Practices">
        <CheckList items={[
          <>Use descriptive <InlineCode>capture_id</InlineCode> values that reflect the data&apos;s purpose (e.g., &quot;raw_orders&quot;, &quot;cleaned_customers&quot;)</>,
          <>Be mindful of performance when enabling <InlineCode>compute_stats=True</InlineCode>. Computing null counts and memory usage can be slow for large DataFrames</>,
        ]} />
      </InfoSection>
    </div>
  )
}
