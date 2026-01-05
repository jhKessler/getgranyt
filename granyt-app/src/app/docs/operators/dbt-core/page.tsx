import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  title: "dbt Core Tracking",
  description: "Automatic metric capture and tracking for dbt Core (CLI) in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/granyt-ai/granyt-sdk/blob/main/src/granyt_sdk/integrations/airflow/operator_adapters/transform/dbt_core.py"

export default function DbtCorePage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Zap}
        title="dbt Core"
        description="Automatic tracking for dbt CLI commands, manifest parsing, and model execution."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt integrates with dbt Core operators (Bash/Python based) to parse `run_results.json` and `manifest.json` for detailed model-level metrics.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>BashOperator (running dbt)</InlineCode>
          <InlineCode>DbtRunOperator</InlineCode>
          <InlineCode>DbtTestOperator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["models_run", "Total number of models executed", "Parsed from run_results.json"],
            ["models_failed", "Number of models that failed", "Parsed from run_results.json"],
            ["tests_run", "Total number of dbt tests executed", "Parsed from run_results.json"],
            ["tests_failed", "Number of dbt tests that failed", "Parsed from run_results.json"],
            ["project_name", "The dbt project name", "Parsed from manifest.json or dbt_project.yml"],
          ]}
        />
      </section>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the dbt Core integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve dbt Core Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for dbt Core metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
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
