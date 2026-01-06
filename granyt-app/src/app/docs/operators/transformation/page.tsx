import { Card, CardContent } from "@/components/ui/card"
import { Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getDocsLink } from "@/lib/utils"
import {
  PageHeader,
  Callout,
} from "../../_components"

export const metadata = {
  title: "Transformation & Compute Operators",
  description: "Deep integration with modern data transformation tools like dbt and Spark.",
}

const tools = [
  {
    name: "dbt Cloud",
    description: "Track job runs, model counts, and execution status for dbt Cloud.",
    href: getDocsLink("/operators/dbt-cloud"),
  },
  {
    name: "dbt Core",
    description: "Monitor CLI commands, manifest parsing, and model execution for dbt Core.",
    href: getDocsLink("/operators/dbt-core"),
  },
  {
    name: "Apache Spark",
    description: "Capture application IDs, execution time, and data volume for Spark jobs.",
    href: getDocsLink("/operators/spark"),
  },
  {
    name: "Bash & Scripts",
    description: "Track exit codes, environment variables, and XCom metrics for scripts.",
    href: getDocsLink("/operators/bash"),
  },
]

export default function TransformationOperatorsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Zap}
        title="Transformation & Compute"
        description="Deep integration with modern data transformation tools like dbt and Spark."
      />

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

        <div className="grid gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <Link key={tool.name} href={tool.href}>
              <Card className="h-full hover:bg-muted/50 transition-colors group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{tool.name}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tool.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

