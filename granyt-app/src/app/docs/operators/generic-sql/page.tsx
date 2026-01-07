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
  title: "Generic SQL Operator Tracking",
  description: "Automatic metric capture and tracking for common SQL operators in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/jhkessler/getgranyt/blob/main/src/granyt_sdk/integrations/airflow/operator_adapters/sql/generic.py"

export default function GenericSQLPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Database}
        title="Generic SQL"
        description="Automatic tracking for common SQL operators and database-specific fallbacks."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          The Generic SQL adapter handles operators from the <InlineCode>apache-airflow-providers-common-sql</InlineCode> package and acts as a fallback for other database operators like SQLite, MySQL, and Oracle.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>SQLExecuteQueryOperator</InlineCode>
          <InlineCode>SQLColumnCheckOperator</InlineCode>
          <InlineCode>SQLTableCheckOperator</InlineCode>
          <InlineCode>SQLCheckOperator</InlineCode>
          <InlineCode>SQLValueCheckOperator</InlineCode>
          <InlineCode>SQLIntervalCheckOperator</InlineCode>
          <InlineCode>BranchSQLOperator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["row_count", "Number of rows returned by the query", "Extracted from XCom return value (integer or list length)"],
            ["database", "Target database name", "Operator attribute: database or conn_id metadata"],
            ["schema", "Target schema name", "Operator attribute: schema"],
            ["table", "Target table name (for check operators)", "Operator attribute: table"],
            ["query_text", "SQL query text executed", "Operator attribute: sql"],
          ]}
        />
      </section>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the Generic SQL integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve Generic SQL Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for Generic SQL metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
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
