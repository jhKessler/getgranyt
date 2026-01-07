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
  title: "dbt Cloud Tracking",
  description: "Automatic metric capture and tracking for dbt Cloud jobs in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/jhkessler/getgranyt/blob/main/src/granyt_sdk/integrations/airflow/operator_adapters/transform/dbt_cloud.py"

export default function DbtCloudPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Zap}
        title="dbt Cloud"
        description="Automatic tracking for dbt Cloud job runs, model counts, and execution status."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt integrates with dbt Cloud operators to track job execution details, including the number of models run and their success rates.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>DbtCloudRunJobOperator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["job_id", "The dbt Cloud Job ID", "Operator attribute: job_id"],
            ["run_id", "The specific Run ID for this execution", "Extracted from XCom return value"],
            ["models_run", "Total number of models executed", "Extracted from dbt Cloud API run metadata"],
            ["models_failed", "Number of models that failed", "Extracted from dbt Cloud API run metadata"],
            ["models_skipped", "Number of models skipped", "Extracted from dbt Cloud API run metadata"],
          ]}
        />
      </section>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the dbt Cloud integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve dbt Cloud Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for dbt Cloud metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
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
