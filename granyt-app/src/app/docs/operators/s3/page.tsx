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
  title: "AWS S3 Operator Tracking",
  description: "Automatic metric capture and tracking for AWS S3 operators in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/jhkessler/getgranyt/blob/main/src/granyt_sdk/integrations/airflow/operator_adapters/storage/s3.py"

export default function S3Page() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={HardDrive}
        title="AWS S3"
        description="Automatic tracking for S3 file transfers, bucket operations, and data movement."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt tracks S3 operations by inspecting the source and destination paths, as well as the number of files processed during transfers.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>S3CopyObjectOperator</InlineCode>
          <InlineCode>S3CreateObjectOperator</InlineCode>
          <InlineCode>S3DeleteObjectsOperator</InlineCode>
          <InlineCode>S3ListOperator</InlineCode>
          <InlineCode>S3FileTransformOperator</InlineCode>
          <InlineCode>S3ToRedshiftOperator</InlineCode>
          <InlineCode>S3ToSnowflakeOperator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["files_processed", "Number of files/keys transferred or modified", "Extracted from XCom return value (list length)"],
            ["bytes_processed", "Total size of data transferred in bytes", "Calculated from local file size (if uploading) or S3 metadata"],
            ["source_path", "Source bucket name", "Operator attribute: bucket or source_bucket_name"],
            ["destination_path", "Destination bucket/key", "Operator attribute: dest_bucket_name or s3_bucket"],
          ]}
        />
      </section>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the S3 integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve S3 Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for S3 metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
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
