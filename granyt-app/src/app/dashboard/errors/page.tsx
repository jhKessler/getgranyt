"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { useEnvironment } from "@/lib/environment-context"
import { useDocumentTitle } from "@/lib/use-document-title"
import { PageHeader, PageSkeleton } from "@/components/shared"
import { RecentErrorsCard } from "../_components"
import { EnvironmentType } from "@/server/services/dashboard/types"

export default function ErrorsPage() {
  useDocumentTitle("Errors")
  const router = useRouter()
  const { environments, defaultEnvironment, isLoading: envsLoading } = useEnvironment()

  // Get default and non-default environment names
  const defaultEnvName = defaultEnvironment ?? undefined
  const nonDefaultEnvNames = environments.filter((e) => !e.isDefault).map((e) => e.name)

  const { data: defaultErrors, isLoading: defaultLoading } = trpc.dashboard.getErrorsByEnvironmentType.useQuery({ 
    type: EnvironmentType.Default,
    limit: 100,
    defaultEnvironmentName: defaultEnvName,
  }, {
    enabled: !!defaultEnvName,
  })

  const { data: nonDefaultErrors, isLoading: nonDefaultLoading } = trpc.dashboard.getErrorsByEnvironmentType.useQuery({ 
    type: EnvironmentType.NonDefault,
    limit: 100,
    defaultEnvironmentName: defaultEnvName,
    nonDefaultEnvironmentNames: nonDefaultEnvNames.length > 0 ? nonDefaultEnvNames : undefined,
  })

  const isLoading = defaultLoading || nonDefaultLoading || envsLoading
  const _hasMultipleEnvs = environments.length > 1
  const hasDefaultEnv = !!defaultEnvName

  // If only one environment, redirect to that environment's detail page
  useEffect(() => {
    if (!envsLoading && environments.length === 1) {
      const singleEnv = environments[0]
      router.replace(`/dashboard/errors/${singleEnv.isDefault ? "default" : "non-default"}`)
    }
  }, [environments, envsLoading, router])

  if (isLoading || environments.length === 1) {
    return <PageSkeleton rows={2} showHeader />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Errors"
        description="Track and manage errors across your DAGs"
      />

      <div className="space-y-6">
        {hasDefaultEnv && (
          <RecentErrorsCard 
            title={`Errors in ${defaultEnvName}`}
            description="Errors in the default environment"
            errors={defaultErrors ?? []} 
            isLoading={defaultLoading}
            showViewAll={false}
            maxItems={Infinity}
          />
        )}
        <RecentErrorsCard 
          title="Errors in other environments"
          description="Errors in non-default environments"
          errors={nonDefaultErrors ?? []} 
          isLoading={nonDefaultLoading}
          showViewAll={false}
          viewMoreHref="/dashboard/errors/non-default"
        />
      </div>
    </div>
  )
}
