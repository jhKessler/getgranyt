import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Minus, Circle } from "lucide-react"

type ComparisonValue = boolean | "partial" | "manual"

interface ComparisonRow {
  feature: string
  granyt: ComparisonValue
  sentry: ComparisonValue
  grafana: ComparisonValue
}

const comparisonData: ComparisonRow[] = [
  { feature: "Airflow-native integration", granyt: true, sentry: "partial", grafana: false },
  { feature: "Error tracking with stack traces", granyt: true, sentry: true, grafana: false },
  { feature: "Local variables capture", granyt: true, sentry: true, grafana: false },
  { feature: "DAG run tracking", granyt: true, sentry: false, grafana: "manual" },
  { feature: "DataFrame metrics", granyt: true, sentry: false, grafana: false },
  { feature: "Custom business metrics", granyt: true, sentry: false, grafana: true },
  { feature: "Zero-code setup", granyt: true, sentry: true, grafana: false },
  { feature: "Data lineage tracking", granyt: true, sentry: false, grafana: false },
  { feature: "Open source & self-hosted", granyt: true, sentry: true, grafana: true },
]

function ComparisonCell({ value }: { value: ComparisonValue }) {
  if (value === true) {
    return <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
  }
  if (value === "partial") {
    return <Circle className="h-5 w-5 text-yellow-500 mx-auto" />
  }
  if (value === "manual") {
    return <span className="text-sm text-muted-foreground">Manual</span>
  }
  return <Minus className="h-5 w-5 text-muted-foreground/50 mx-auto" />
}

export function ComparisonSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary">Why Granyt?</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Built specifically for data teams
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlike general-purpose tools, Granyt understands Airflow. 
            Get deep observability without complex configuration.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 font-medium text-muted-foreground">Feature</th>
                <th className="text-center py-4 px-4 min-w-[100px]">
                  <span className="font-bold text-primary">Granyt</span>
                </th>
                <th className="text-center py-4 px-4 min-w-[100px]">
                  <span className="font-medium text-muted-foreground">Sentry</span>
                </th>
                <th className="text-center py-4 px-4 min-w-[100px]">
                  <span className="font-medium text-muted-foreground">Grafana</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row) => (
                <tr key={row.feature} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-4 text-sm">{row.feature}</td>
                  <td className="py-4 px-4 text-center">
                    <ComparisonCell value={row.granyt} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <ComparisonCell value={row.sentry} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <ComparisonCell value={row.grafana} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Circle className="h-3 w-3 text-yellow-500 inline-block mr-1" /> = Partial support
        </p>
      </div>
    </section>
  )
}
