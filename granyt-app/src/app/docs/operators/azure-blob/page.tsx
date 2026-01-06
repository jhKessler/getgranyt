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
  title: "Azure Blob Storage Tracking",
  description: "Automatic metric capture and tracking for Azure Blob Storage operators in Airflow.",
}

const GITHUB_ADAPTER_URL = "https://github.com/granyt-ai/granyt-sdk/blob/main/src/granyt_sdk/integrations/airflow/operator_adapters/storage/azure.py"

export default function AzureBlobPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon={HardDrive}
        title="Azure Blob Storage"
        description="Automatic tracking for Azure containers, blobs, and data transfers."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Granyt integrates with Azure Blob Storage operators to track container operations, blob counts, and transfer volumes.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Supported Operators</h2>
        <div className="flex flex-wrap gap-2">
          <InlineCode>WasbBlobSensor</InlineCode>
          <InlineCode>WasbPrefixSensor</InlineCode>
          <InlineCode>LocalFilesystemToWasbOperator</InlineCode>
          <InlineCode>WasbToLocalFilesystemOperator</InlineCode>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Captured Metrics</h2>
        <DataTable
          headers={["Metric", "Description", "Data Source"]}
          monospaceColumns={[0]}
          rows={[
            ["container_name", "Name of the Azure container", "Operator attribute: container_name"],
            ["blob_name", "Name of the blob or prefix", "Operator attribute: blob_name or prefix"],
            ["files_processed", "Number of blobs transferred", "Calculated from transfer results"],
            ["bytes_processed", "Total size of blobs in bytes", "Extracted from blob properties during transfer"],
          ]}
        />
      </section>

      <InfoSection
        title="Contribute to this Adapter"
        description="Help us improve the Azure integration by contributing to the open-source adapter."
      >
        <div className="flex flex-col md:flex-row items-center gap-6 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              Improve Azure Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              The logic for Azure metric extraction is open-source. If you find a bug or want to add support for more metrics, you can edit the adapter directly on GitHub.
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
