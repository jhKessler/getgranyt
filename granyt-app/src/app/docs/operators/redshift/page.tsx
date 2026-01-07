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
  title: "Redshift Operator Tracking",
  description: "Automatic metric capture and tracking for Amazon Redshift operators in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/jhkessler/getgranyt/blob/main/src/granyt_sdk/integrations/airflow/operator_adapters/sql/redshift.py"

export default function RedshiftPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Database}
        title="Amazon Redshift"
        description="Automatic tracking for Redshift queries, data API jobs, and S3 transfers."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt supports both the classic Redshift SQL operators and the modern Redshift Data API operators, capturing query IDs and row counts automatically.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>RedshiftSQLOperator</InlineCode>
          <InlineCode>RedshiftDataOperator</InlineCode>
          <InlineCode>RedshiftCheckOperator</InlineCode>
          <InlineCode>S3ToRedshiftOperator</InlineCode>
          <InlineCode>RedshiftToS3Operator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["row_count", "Number of rows modified or returned", "Extracted from XCom return value (integer or list length)"],
            ["query_id", "Redshift Query/Job ID", "Extracted from Redshift Data API response in XCom"],
            ["database", "Target database name", "Operator attribute: database"],
            ["schema", "Target schema name", "Operator attribute: schema"],
            ["region", "AWS region of the cluster", "Operator attribute: region"],
            ["query_text", "The SQL query executed (sanitized)", "Operator attribute: sql"],
            ["connection_id", "Airflow connection ID used", "Operator attribute: redshift_conn_id or aws_conn_id"],
          ]}
        />
      </section>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the Redshift integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve Redshift Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for Redshift metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
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
