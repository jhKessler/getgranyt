import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  HardDrive,
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
  title: "Google Cloud Storage Tracking",
  description: "Automatic metric capture and tracking for GCS operators in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/granyt-ai/granyt-sdk/blob/main/src/granyt_sdk/integrations/airflow/operator_adapters/storage/gcs.py"

export default function GCSPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={HardDrive}
        title="Google Cloud Storage"
        description="Automatic tracking for GCS objects, bucket synchronization, and data movement."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt integrates with GCS operators to track file counts, data volume, and regional metadata for your cloud storage operations.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>GCSCreateBucketOperator</InlineCode>
          <InlineCode>GCSListObjectsOperator</InlineCode>
          <InlineCode>GCSDeleteObjectsOperator</InlineCode>
          <InlineCode>GCSSynchronizeBucketsOperator</InlineCode>
          <InlineCode>LocalFilesystemToGCSOperator</InlineCode>
          <InlineCode>GCSToLocalFilesystemOperator</InlineCode>
          <InlineCode>GCSToBigQueryOperator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["files_processed", "Number of objects processed", "Extracted from XCom return value (list length)"],
            ["bytes_processed", "Total size of objects in bytes", "Extracted from GCS object metadata in XCom"],
            ["source_path", "Source bucket name", "Operator attribute: bucket_name or source_bucket"],
            ["destination_path", "Destination bucket name", "Operator attribute: destination_bucket"],
            ["region", "GCS location/region for bucket operations", "Operator attribute: location"],
          ]}
        />
      </section>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the GCS integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve GCS Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for GCS metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
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
