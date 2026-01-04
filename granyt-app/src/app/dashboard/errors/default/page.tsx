"use client"

import { trpc } from "@/lib/trpc"
import { useEnvironment } from "@/lib/environment-context"
import { useDocumentTitle } from "@/lib/use-document-title"
import { PageHeader, PageSkeleton } from "@/components/shared"
import { ErrorsList } from "../_components"
import { EnvironmentType } from "@/server/services/dashboard/types"

export default function DefaultEnvironmentErrorsPage() {
  const { defaultEnvironment, isLoading: envsLoading } = useEnvironment()
  
  const displayName = defaultEnvironment 
    ? defaultEnvironment.charAt(0).toUpperCase() + defaultEnvironment.slice(1)
    : "Default"
  
  useDocumentTitle(`${displayName} Errors`)
  
  const { data: errors, isLoading } = trpc.dashboard.getErrorsByEnvironmentType.useQuery({ 
    type: EnvironmentType.Default,
    limit: 200,
    defaultEnvironmentName: defaultEnvironment ?? undefined,
  }, {
    enabled: !!defaultEnvironment,
  })

  if (isLoading || envsLoading) {
    return <PageSkeleton rows={10} showHeader />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${displayName} Errors`}
        description={`${errors?.length ?? 0} error${errors?.length !== 1 ? "s" : ""} in ${defaultEnvironment || "default environment"} requiring attention`}
        backHref="/dashboard/errors"
      />

      <ErrorsList 
        errors={errors ?? []} 
        emptyMessage={`All ${defaultEnvironment || "default"} DAGs are running smoothly`}
      />
    </div>
  )
}
