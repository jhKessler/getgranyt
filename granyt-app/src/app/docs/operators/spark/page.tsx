import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Zap,
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
  title: "Apache Spark Tracking",
  description: "Automatic metric capture and tracking for Spark jobs in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/granyt-ai/granyt-sdk/blob/main/src/granyt_sdk/integrations/airflow/operator_adapters/transform/spark.py"

export default function SparkPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Zap}
        title="Apache Spark"
        description="Automatic tracking for Spark Submit, Spark JDBC, and Databricks Spark jobs."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt integrates with Spark operators to track application IDs, execution time, and data volume processed by Spark jobs.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>SparkSubmitOperator</InlineCode>
          <InlineCode>SparkJDBCOperator</InlineCode>
          <InlineCode>SparkSqlOperator</InlineCode>
          <InlineCode>DatabricksSubmitRunOperator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["application_id", "The Spark Application ID", "Extracted from operator logs or XCom"],
            ["executor_memory", "Memory allocated per executor", "Operator attribute: executor_memory"],
            ["total_cores", "Total CPU cores used", "Operator attribute: total_executor_cores"],
            ["rows_affected", "Number of rows processed (if available)", "Extracted from Spark UI/Logs via adapter"],
          ]}
        />
      </section>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the Spark integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve Spark Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for Spark metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
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
