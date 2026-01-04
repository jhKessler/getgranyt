"use client"

import { PageHeader } from "@/components/shared"
import { mockRecentErrors } from "../_data/mock-data"
import { RecentErrorsCard } from "@/app/dashboard/_components"

export default function DemoErrorsPage() {
  // Split errors by environment for display
  const productionErrors = mockRecentErrors.filter(e => e.environments?.includes("production"))
  const otherErrors = mockRecentErrors.filter(e => !e.environments?.includes("production") || e.environments.length > 1)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Errors"
        description="Track and manage errors across your DAGs"
      />

      <div className="space-y-6">
        <RecentErrorsCard 
          title="Errors in production"
          description="Errors in the default environment"
          errors={productionErrors}
          isLoading={false}
          showViewAll={false}
          basePath="/demo"
          maxItems={Infinity}
        />
        <RecentErrorsCard 
          title="Errors in other environments"
          description="Errors in non-default environments"
          errors={otherErrors}
          isLoading={false}
          showViewAll={false}
          basePath="/demo"
        />
      </div>
    </div>
  )
}
