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
  title: "Postgres Operator Tracking",
  description: "Automatic metric capture and tracking for PostgreSQL operators in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/jhkessler/getgranyt/blob/main/src/granyt_sdk/integrations/airflow/operator_adapters/sql/postgres.py"

export default function PostgresPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Database}
        title="PostgreSQL"
        description="Automatic tracking for Postgres queries, row counts, and schema metadata."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt tracks Postgres operations by inspecting the results of the <InlineCode>PostgresOperator</InlineCode> and its variants. It captures the number of rows affected by DML or returned by SELECT queries.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>PostgresOperator</InlineCode>
          <InlineCode>PostgresCheckOperator</InlineCode>
          <InlineCode>PostgresValueCheckOperator</InlineCode>
          <InlineCode>PostgresIntervalCheckOperator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["row_count", "Number of rows affected or returned", "Extracted from XCom return value (integer or list length)"],
            ["database", "Target database name", "Operator attribute: database"],
            ["schema", "Target schema name", "Operator attribute: schema"],
            ["query_text", "The SQL query executed (sanitized)", "Operator attribute: sql"],
            ["connection_id", "Airflow connection ID used", "Operator attribute: postgres_conn_id"],
          ]}
        />
      </section>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the Postgres integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve Postgres Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for Postgres metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
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
