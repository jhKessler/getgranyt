"use client"

import { trpc } from "@/lib/trpc"
import { useEnvironment } from "@/lib/environment-context"
import { useDocumentTitle } from "@/lib/use-document-title"
import { PageHeader, PageSkeleton } from "@/components/shared"
import { ErrorsList } from "../_components"
import { EnvironmentType } from "@/server/services/dashboard/types"

export default function NonDefaultEnvironmentErrorsPage() {
  useDocumentTitle("Other Environment Errors")
  const { environments, defaultEnvironment } = useEnvironment()
  
  const nonDefaultEnvNames = environments.filter((e) => !e.isDefault).map((e) => e.name)
  
  const { data: errors, isLoading } = trpc.dashboard.getErrorsByEnvironmentType.useQuery({ 
    type: EnvironmentType.NonDefault,
    limit: 200,
    defaultEnvironmentName: defaultEnvironment ?? undefined,
    nonDefaultEnvironmentNames: nonDefaultEnvNames.length > 0 ? nonDefaultEnvNames : undefined,
  })

  if (isLoading) {
    return <PageSkeleton rows={10} showHeader />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Other Environment Errors"
        description={`${errors?.length ?? 0} error${errors?.length !== 1 ? "s" : ""} in non-default environments`}
        backHref="/dashboard/errors"
      />

      <ErrorsList 
        errors={errors ?? []} 
        emptyMessage="All other DAGs are running smoothly"
      />
    </div>
  )
}
