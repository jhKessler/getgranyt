 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  BarChart3,
  Code2,
  Layers,
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
  InlineCode,
} from "../_components"

export const metadata = {
  title: "Manual Metric Capture",
  description: "Capture DataFrame statistics, track data quality, and understand manual metric tracking in Granyt.",
}

export default function MetricsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={BarChart3}
        title="Manual Metric Capture"
        description="Capture DataFrame statistics, track data quality, and track specific statistics from your DataFrames."
      />

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          While Granyt provides <Link href="/docs/operators" className="text-primary hover:underline">Automatic Operator Tracking</Link> for many Airflow operators, you can also manually capture metrics from your DataFrames using the Granyt SDK.
        </p>
      </section>

      {/* Manual Capture */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Using compute_df_metrics</h2>
        </div>
        <p className="text-muted-foreground">
          The <InlineCode>compute_df_metrics</InlineCode> function 
          lets you capture statistics from your DataFrames at any point in your DAG. 
          Use it to track row counts, schema information, data quality metrics, and custom KPIs.
          Metrics are passed to Granyt via the <InlineCode>granyt</InlineCode> key in your task&apos;s return value,
          with DataFrame schema passed to the <InlineCode>df_schema</InlineCode> sub-key.
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

    # Compute metrics from the DataFrame, e.g. row count, column dtypes, etc.
    # Pass to df_schema for automatic schema tracking
    return {
        "granyt": {
            "df_schema": compute_df_metrics(df),
            "custom_metric": 42
        }
    }`}
            />
          </CardContent>
        </Card>

        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold">Deep Data Insights</h3>
          <p className="text-muted-foreground">
            Granyt captures deep insights into your data quality by performing a scan of the DataFrame to calculate:
          </p>
          
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardContent className="text-sm text-muted-foreground pt-6">
                <ul className="list-disc list-inside space-y-1">
                  <li>Null counts for every column</li>
                  <li>Empty string counts for text columns</li>
                  <li>Actual memory usage in bytes</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Callout variant="info">
            These metrics are always computed to provide you with the best possible visibility into your data pipelines.
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
) -> Dict[str, Any]`}
            />
            <p className="text-sm text-muted-foreground mb-4 mt-6">
              Computes metrics from a DataFrame for use with the <InlineCode>granyt</InlineCode> key.
              Returns a dictionary that should be assigned to <InlineCode>granyt[&quot;df_schema&quot;]</InlineCode>.
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
              The function returns a dictionary containing all computed metrics, ready to be assigned to your <InlineCode>granyt[&quot;df_schema&quot;]</InlineCode> return value:
            </p>
            <DataTable
              headers={["Field", "Type", "Description"]}
              rows={[
                ["row_count", "int", "Number of rows"],
                ["column_count", "int", "Number of columns"],
                ["dataframe_type", "str", '"pandas", "polars", "spark", etc.'],
                ["column_dtypes", "Dict[str, str]", "Column name to dtype mapping"],
                ["null_counts", "Dict[str, int]", "Null counts per column"],
                ["empty_string_counts", "Dict[str, int]", "Empty string counts"],
                ["memory_bytes", "int", "Memory usage in bytes"],
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
              The SDK automatically calls <InlineCode>.cache()</InlineCode> on your DataFrame 
              if it isn&apos;t already cached. This ensures that the work done to calculate 
              metrics is reused by your subsequent ETL steps.
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
    
    # Return data and schema metrics
    return {
        "data": df.to_dict(),
        "granyt": {
            "df_schema": compute_df_metrics(df)
        }
    }

@task
def transform_users(payload):
    """Transform and enrich user data."""
    df = pd.DataFrame(payload["data"])
    
    # Apply transformations
    df['full_name'] = df['first_name'] + ' ' + df['last_name']
    df['signup_date'] = pd.to_datetime(df['signup_date'])
    
    # Return with schema and custom KPIs
    return {
        "data": df.to_dict(),
        "granyt": {
            "df_schema": compute_df_metrics(df),
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
    
    return {
        "rows_loaded": rows_loaded,
        "granyt": {
            "df_schema": compute_df_metrics(df),
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
          <>Always return metrics via the <InlineCode>granyt</InlineCode> key with DataFrame schema in <InlineCode>df_schema</InlineCode></>,
        ]} />
      </InfoSection>
    </div>
  )
}
