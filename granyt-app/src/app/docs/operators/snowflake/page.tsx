import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Database,
  Github,
  ExternalLink,
  Info,
} from "lucide-react"
import {
  PageHeader,
  DataTable,
  Callout,
  InfoSection,
  InlineCode,
} from "../../_components"

export const metadata = {
  title: "Snowflake Operator Tracking",
  description: "Automatic metric capture and tracking for Snowflake operators in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/jhKessler/getgranyt/blob/main/granyt-sdk/src/granyt_sdk/integrations/airflow/operator_adapters/sql/snowflake.py"

export default function SnowflakePage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Database}
        title="Snowflake"
        description="Automatic tracking for Snowflake queries, warehouses, and data movement."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt automatically hooks into Snowflake operators to capture query performance, data volume, and execution context. This works by inspecting the operator&apos;s internal state and the results returned to Airflow&apos;s XCom system.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>SnowflakeOperator</InlineCode>
          <InlineCode>SnowflakeSqlApiOperator</InlineCode>
          <InlineCode>SnowflakeCheckOperator</InlineCode>
          <InlineCode>SnowflakeValueCheckOperator</InlineCode>
          <InlineCode>SnowflakeIntervalCheckOperator</InlineCode>
          <InlineCode>S3ToSnowflakeOperator</InlineCode>
          <InlineCode>SnowflakeToS3Operator</InlineCode>
          <InlineCode>SnowflakeToGCSOperator</InlineCode>
          <InlineCode>GCSToSnowflakeOperator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["row_count", "Number of rows modified or returned by the query", "Extracted from the XCom return value (integer or list length)"],
            ["query_id", "Snowflake Query ID for deep tracing", "Captured from the Snowflake operator's execution metadata"],
            ["warehouse", "The Snowflake warehouse used for execution", "Operator attribute: warehouse"],
            ["database", "Target database name", "Operator attribute: database"],
            ["schema", "Target schema name", "Operator attribute: schema"],
            ["role", "Snowflake role used for the query (in custom_metrics)", "Operator attribute: role"],
            ["connection_id", "Airflow connection ID used", "Operator attribute: snowflake_conn_id"],
          ]}
        />
      </section>

      <Callout variant="info">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 mt-0.5" />
          <div>
            <p className="font-semibold">Pro Tip: Row Counts</p>
            <p className="text-sm">For <InlineCode>SnowflakeOperator</InlineCode>, ensure <InlineCode>do_xcom_push=True</InlineCode> (default) is enabled so Granyt can extract the row count from the query result.</p>
          </div>
        </div>
      </Callout>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the Snowflake integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve Snowflake Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for Snowflake metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
            </p>
          </div>
          <Button asChild variant="default">
            <Link href={GITHUB_ADAPTER_URL} target="_blank">
              View Adapter on GitHub
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </InfoSection>
    </div>
  )
}
