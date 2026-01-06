import { Card, CardContent } from "@/components/ui/card"
import { Database, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import {
  PageHeader,
  Callout,
} from "../../_components"

export const metadata = {
  title: "SQL & Data Warehouse Operators",
  description: "Automatic tracking for query performance, data volume, and lineage across major data platforms.",
}

const warehouses = [
  {
    name: "Snowflake",
    description: "Track row counts, query IDs, and warehouse usage for Snowflake operations.",
    href: "/docs/operators/snowflake",
  },
  {
    name: "BigQuery",
    description: "Monitor bytes billed, slot usage, and job statistics for BigQuery.",
    href: "/docs/operators/bigquery",
  },
  {
    name: "Amazon Redshift",
    description: "Capture execution metadata and data movement for Redshift clusters.",
    href: "/docs/operators/redshift",
  },
  {
    name: "PostgreSQL",
    description: "Track row counts and query performance for Postgres databases.",
    href: "/docs/operators/postgres",
  },
  {
    name: "Generic SQL",
    description: "Support for MySQL, SQLite, Oracle, and other SQL-based operators.",
    href: "/docs/operators/generic-sql",
  },
]

export default function SqlOperatorsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={Database}
        title="SQL & Data Warehouse"
        description="Automatic tracking for query performance, data volume, and lineage across major data platforms."
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
          {warehouses.map((warehouse) => (
            <Link key={warehouse.name} href={warehouse.href}>
              <Card className="h-full hover:bg-muted/50 transition-colors group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {warehouse.description}
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

