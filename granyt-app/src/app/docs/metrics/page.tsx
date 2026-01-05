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
                  Supports <code className="text-xs">SnowflakeOperator</code>, <code className="text-xs">SnowflakeSqlApiOperator</code>, <code className="text-xs">SnowflakeCheckOperator</code>, and <code className="text-xs">S3ToSnowflakeOperator</code>.
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
                    ["role", "Snowflake role used for the query (in custom_metrics)"],
                    ["connection_id", "Airflow connection ID used"],
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
                  Supports <code className="text-xs">BigQueryInsertJobOperator</code>, <code className="text-xs">BigQueryCheckOperator</code>, <code className="text-xs">BigQueryValueCheckOperator</code>, <code className="text-xs">BigQueryGetDataOperator</code>, and <code className="text-xs">GCSToBigQueryOperator</code>.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["bytes_processed", "Total bytes processed by the job (billable)"],
                    ["bytes_billed", "Total bytes billed for the query"],
                    ["row_count", "Number of rows modified (from numDmlAffectedRows) or returned"],
                    ["query_id", "BigQuery Job ID"],
                    ["slot_milliseconds", "Total slot time consumed by the query"],
                    ["connection_id", "Airflow connection ID (gcp_conn_id)"],
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Generic SQL</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports <code className="text-xs">SQLExecuteQueryOperator</code>, <code className="text-xs">SQLColumnCheckOperator</code>, <code className="text-xs">SQLTableCheckOperator</code>, <code className="text-xs">SQLCheckOperator</code>, <code className="text-xs">SQLValueCheckOperator</code>, <code className="text-xs">SQLIntervalCheckOperator</code>, and <code className="text-xs">BranchSQLOperator</code>.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["row_count", "Number of rows returned by the query"],
                    ["database", "Target database name"],
                    ["schema", "Target schema name"],
                    ["table", "Target table name (for check operators)"],
                    ["query_text", "SQL query text executed"],
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
                  <h3 className="font-semibold text-lg">AWS S3</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports <code className="text-xs">S3CopyObjectOperator</code>, <code className="text-xs">S3CreateObjectOperator</code>, <code className="text-xs">S3DeleteObjectsOperator</code>, <code className="text-xs">S3ListOperator</code>, <code className="text-xs">S3FileTransformOperator</code>, <code className="text-xs">S3CreateBucketOperator</code>, and <code className="text-xs">S3DeleteBucketOperator</code>.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["files_processed", "Number of files/keys transferred or modified"],
                    ["bytes_processed", "Total size of data transferred in bytes"],
                    ["source_path", "Source bucket name (e.g., source_bucket_name, bucket)"],
                    ["destination_path", "Destination bucket/key (e.g., dest_bucket_name, s3_bucket/s3_key)"],
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Google Cloud Storage</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports <code className="text-xs">GCSCreateBucketOperator</code>, <code className="text-xs">GCSListObjectsOperator</code>, <code className="text-xs">GCSDeleteObjectsOperator</code>, <code className="text-xs">GCSSynchronizeBucketsOperator</code>, <code className="text-xs">GCSDeleteBucketOperator</code>, <code className="text-xs">LocalFilesystemToGCSOperator</code>, and <code className="text-xs">GCSToLocalFilesystemOperator</code>.
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["files_processed", "Number of objects processed (from XCom results)"],
                    ["bytes_processed", "Total size of objects in bytes"],
                    ["source_path", "Source bucket name"],
                    ["destination_path", "Destination bucket name (bucket_name attribute)"],
                    ["region", "GCS location/region for bucket operations"],
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
                  Supports dbt Cloud operators (<code className="text-xs">DbtCloudRunJobOperator</code>, <code className="text-xs">DbtCloudGetJobRunArtifactOperator</code>, <code className="text-xs">DbtCloudListJobsOperator</code>) and dbt Core operators (<code className="text-xs">DbtRunOperator</code>, <code className="text-xs">DbtTestOperator</code>, <code className="text-xs">DbtSeedOperator</code>, <code className="text-xs">DbtSnapshotOperator</code>).
                </p>
                <DataTable
                  headers={["Metric", "Description"]}
                  monospaceColumns={[0]}
                  rows={[
                    ["models_run", "Number of dbt models executed (from run_results)"],
                    ["tests_passed", "Number of dbt tests that passed"],
                    ["tests_failed", "Number of dbt tests that failed"],
                    ["row_count", "Total rows affected (sum of adapter_response.rows_affected)"],
                    ["job_id", "dbt Cloud Job ID (custom_metrics)"],
                    ["account_id", "dbt Cloud Account ID (custom_metrics)"],
                    ["run_id", "dbt Cloud Run ID (query_id)"],
                    ["path", "dbt project path for Core operators (custom_metrics)"],
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
          The <InlineCode>compute_df_metrics</InlineCode> function 
          lets you capture statistics from your DataFrames at any point in your DAG. 
          Use it to track row counts, schema information, data quality metrics, and custom KPIs.
          Metrics are passed to Granyt via the <InlineCode>granyt_metrics</InlineCode> key in your task&apos;s return value.
        </p>
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <CodeBlock 
              language="python"
              code={`from airflow.decorators import task
from granyt_sdk import compute_df_metrics
import pandas as pd

@task
def process_users():
    df = pd.DataFrame({
        "user_id": [1, 2, None, 4],
        "name": ["Alice", "", "Charlie", "David"],
        "score": [95.5, 87.3, 91.2, 88.8]
    })

    # Compute metrics from the DataFrame
    metrics = compute_df_metrics(df)
    
    # Return via granyt_metrics - this is how metrics reach Granyt
    return {
        "granyt_metrics": {
            **metrics,
            "custom_metric": 42
        }
    }`}
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
              compute_df_metrics()
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock 
              language="python"
              code={`def compute_df_metrics(
    df: Any,
    compute_stats: Optional[bool] = None,
) -> Dict[str, Any]`}
            />
            <p className="text-sm text-muted-foreground mb-4 mt-6">
              Computes metrics from a DataFrame for use with <InlineCode>granyt_metrics</InlineCode> XCom.
              Returns a dictionary that can be spread directly into your return value.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Parameters */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Parameters</h2>
        
        <ParameterCard
          name="df"
          description="The DataFrame to compute metrics from. Supports Pandas, Polars, PySpark, or any custom registered type."
          type="Any"
          typeLabel="DataFrame-like object"
        />

        <ParameterCard
          name="compute_stats"
          description="Whether to compute statistics like null counts, empty string counts, and memory usage. Be mindful of performance: these operations can be slow for large DataFrames."
          type="Optional[bool]"
          defaultValue="GRANYT_COMPUTE_STATS"
          defaultNote="env var (default: false)"
          example="compute_df_metrics(df, compute_stats=True)"
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
      </section>

      {/* Return Value */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Return Value</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-lg">
              <Layers className="h-5 w-5 text-primary" />
              Dict[str, Any]
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The function returns a dictionary containing all computed metrics, ready to be spread into your <InlineCode>granyt_metrics</InlineCode> return value:
            </p>
            <DataTable
              headers={["Field", "Type", "Description"]}
              rows={[
                ["row_count", "int", "Number of rows"],
                ["column_count", "int", "Number of columns"],
                ["dataframe_type", "str", '"pandas", "polars", "spark", etc.'],
                ["column_dtypes", "Dict[str, str]", "Column name to dtype mapping"],
                ["null_counts", "Dict[str, int]", "Null counts per column (if computed)"],
                ["empty_string_counts", "Dict[str, int]", "Empty string counts (if computed)"],
                ["memory_bytes", "int", "Memory usage (if computed)"],
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
              code={`from airflow.decorators import dag, task
from granyt_sdk import compute_df_metrics
import pandas as pd
from datetime import datetime

@task
def extract_users():
    """Extract user data from source."""
    df = pd.read_csv("users.csv")
    
    # Compute metrics for the raw data
    metrics = compute_df_metrics(df)
    
    # Return data and metrics
    return {
        "data": df.to_dict(),
        "granyt_metrics": metrics
    }

@task
def transform_users(payload):
    """Transform and enrich user data."""
    df = pd.DataFrame(payload["data"])
    
    # Apply transformations
    df['full_name'] = df['first_name'] + ' ' + df['last_name']
    df['signup_date'] = pd.to_datetime(df['signup_date'])
    
    # Compute metrics with deep stats and custom KPIs
    metrics = compute_df_metrics(df, compute_stats=True)
    
    return {
        "data": df.to_dict(),
        "granyt_metrics": {
            **metrics,
            "valid_emails": int((df['email'].str.contains('@')).sum()),
            "active_users": int((df['status'] == 'active').sum())
        }
    }

@task
def load_users(payload):
    """Load users to destination."""
    df = pd.DataFrame(payload["data"])
    
    # Load to database...
    rows_loaded = len(df)
    
    # Compute final metrics
    metrics = compute_df_metrics(df)
    
    return {
        "rows_loaded": rows_loaded,
        "granyt_metrics": {
            **metrics,
            "total_users_loaded": rows_loaded
        }
    }

@dag(start_date=datetime(2024, 1, 1), schedule='@daily', catchup=False)
def user_pipeline():
    raw_data = extract_users()
    transformed_data = transform_users(raw_data)
    load_users(transformed_data)

user_pipeline()`}
            />
          </CardContent>
        </Card>
      </section>

      {/* Best Practices */}
      <InfoSection title="Best Practices">
        <CheckList items={[
          <>Use descriptive metric names that reflect the data&apos;s purpose (e.g., row_count, null_rate)</>,
          <>Be mindful of performance when enabling <InlineCode>compute_stats=True</InlineCode>. Computing null counts and memory usage can be slow for large DataFrames</>,
          <>Always return metrics via the <InlineCode>granyt_metrics</InlineCode> key in your task&apos;s return value</>,
        ]} />
      </InfoSection>
    </div>
  )
}
