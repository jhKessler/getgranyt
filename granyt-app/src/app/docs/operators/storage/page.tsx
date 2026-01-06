import { Card, CardContent } from "@/components/ui/card"
import { HardDrive, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import {
  PageHeader,
  Callout,
} from "../../_components"

export const metadata = {
  title: "Cloud Storage Operators",
  description: "Track file transfers and data movement across cloud providers.",
}

const providers = [
  {
    name: "AWS S3",
    description: "Track file transfers, bucket operations, and data volume for Amazon S3.",
    href: "/docs/operators/s3",
  },
  {
    name: "Google Cloud Storage",
    description: "Monitor object counts, bucket synchronization, and regional metadata for GCS.",
    href: "/docs/operators/gcs",
  },
  {
    name: "Azure Blob Storage",
    description: "Capture container operations and blob transfers for Azure storage.",
    href: "/docs/operators/azure-blob",
  },
]

export default function StorageOperatorsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={HardDrive}
        title="Cloud Storage"
        description="Track file transfers and data movement across cloud providers."
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
          {providers.map((provider) => (
            <Link key={provider.name} href={provider.href}>
              <Card className="h-full hover:bg-muted/50 transition-colors group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{provider.name}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {provider.description}
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

