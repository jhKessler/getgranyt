import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, AlertTriangle, BarChart3 } from "lucide-react"

interface ValueCardProps {
  icon: React.ReactNode
  problem: string
  solution: string
  benefit: string
}

function ValueCard({ icon, problem, solution, benefit }: ValueCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/50">
      <CardContent className="p-6 space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive font-medium">Problem:</span> {problem}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">Solution:</span> {solution}
          </p>
        </div>
        <p className="font-semibold text-lg border-t border-border/50 pt-4">
          {benefit}
        </p>
      </CardContent>
    </Card>
  )
}

const valueProps: ValueCardProps[] = [
  {
    icon: <AlertTriangle className="h-6 w-6" />,
    problem: "DAG failures hide in logs. You find out hours later from a downstream report.",
    solution: "Instant alerts with full stack traces, local variables, and task context.",
    benefit: "Catch errors in minutes, not hours",
  },
  {
    icon: <Eye className="h-6 w-6" />,
    problem: "No visibility into what's actually happening in your DAGs.",
    solution: "Real-time dashboard showing run status, timing, and trends.",
    benefit: "See your entire DAG health at a glance",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    problem: "Data quality issues slip through until someone notices bad reports.",
    solution: "Track row counts, nulls, and custom metrics at every DAG stage.",
    benefit: "Catch data anomalies before they impact business",
  },
]

export function ValueSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary">The Problem</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Stop flying blind with your Airflow DAGs
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Data teams spend too much time debugging failures and not enough time delivering value. 
            Granyt gives you the visibility you need.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {valueProps.map((prop) => (
            <ValueCard key={prop.benefit} {...prop} />
          ))}
        </div>
      </div>
    </section>
  )
}
