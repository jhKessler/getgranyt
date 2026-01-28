import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Database,
  Github,
  ExternalLink,
} from "lucide-react"
import {
  PageHeader,
  DataTable,
  InfoSection,
  InlineCode,
} from "../../_components"

export const metadata = {
  title: "BigQuery Operator Tracking",
  description: "Automatic metric capture and tracking for Google BigQuery operators in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/jhKessler/getgranyt/blob/main/granyt-sdk/src/granyt_sdk/integrations/airflow/operator_adapters/sql/bigquery.py"

export default function BigQueryPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Database}
        title="BigQuery"
        description="Automatic tracking for BigQuery jobs, bytes processed, and slot usage."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt integrates with BigQuery operators to track cost-related metrics like bytes processed and billed, as well as performance metrics like slot time.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>BigQueryInsertJobOperator</InlineCode>
          <InlineCode>BigQueryExecuteQueryOperator</InlineCode>
          <InlineCode>BigQueryCheckOperator</InlineCode>
          <InlineCode>BigQueryValueCheckOperator</InlineCode>
          <InlineCode>BigQueryGetDataOperator</InlineCode>
          <InlineCode>GCSToBigQueryOperator</InlineCode>
          <InlineCode>BigQueryToGCSOperator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["bytes_processed", "Total bytes processed by the job (billable)", "Extracted from BigQuery Job statistics in XCom"],
            ["bytes_billed", "Total bytes billed for the query", "Extracted from BigQuery Job statistics in XCom"],
            ["row_count", "Number of rows modified or returned", "Extracted from numDmlAffectedRows or totalRows in Job metadata"],
            ["query_id", "BigQuery Job ID", "Extracted from the Job ID in XCom"],
            ["slot_milliseconds", "Total slot time consumed by the query", "Extracted from Job statistics in XCom"],
            ["connection_id", "Airflow connection ID (gcp_conn_id)", "Operator attribute: gcp_conn_id"],
          ]}
        />
      </section>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the BigQuery integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve BigQuery Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for BigQuery metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
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
