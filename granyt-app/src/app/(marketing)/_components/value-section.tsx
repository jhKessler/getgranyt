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
    problem: "DAG failures are buried in task logs, making root cause analysis slow.",
    solution: "Automatic error capture with full stack traces and task-level metadata.",
    benefit: "Identify root causes instantly",
  },
  {
    icon: <Eye className="h-6 w-6" />,
    problem: "Airflow's UI makes it hard to track performance trends and task-level timing.",
    solution: "A dedicated dashboard for run history, duration trends, and success rates.",
    benefit: "Track performance over time",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    problem: "Silent data failures (like empty tables or schema changes) go unnoticed.",
    solution: "Automatic metrics for popular operators plus custom KPIs directly from your tasks.",
    benefit: "Monitor data quality in-flight",
  },
]

export function ValueSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary">The Problem</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Debug Airflow DAGs faster
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop digging through task logs to find the root cause of a failure. 
            Granyt provides the context you need to fix issues quickly.
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
