"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { trpc } from "./trpc"

interface EnvironmentContextType {
  selectedEnvironment: string | null
  setSelectedEnvironment: (env: string | null) => void
  environments: EnvironmentInfo[]
  isLoading: boolean
  defaultEnvironment: string | null
  isProductionEnv: (env: string | null) => boolean
}

interface EnvironmentInfo {
  name: string
  isDefault: boolean
  apiKeyCount: number
}

const EnvironmentContext = createContext<EnvironmentContextType | null>(null)

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [selectedEnvironment, setSelectedEnvironmentState] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const { data: organizations } = trpc.organization.list.useQuery()
  const organizationId = organizations?.[0]?.id

  const { data: environments, isLoading: envsLoading } = trpc.organization.listEnvironments.useQuery(
    { organizationId: organizationId! },
    { enabled: !!organizationId }
  )

  const { data: defaultEnv, isLoading: defaultLoading } = trpc.dashboard.getDefaultEnvironment.useQuery({})

  const isLoading = envsLoading || defaultLoading

  // Initialize with default environment
  useEffect(() => {
    if (hasInitialized) return
    if (!defaultEnv || environments === undefined) return

    setSelectedEnvironmentState(defaultEnv)
    setHasInitialized(true)
  }, [defaultEnv, environments, hasInitialized])

  const setSelectedEnvironment = useCallback((env: string | null) => {
    setSelectedEnvironmentState(env)
  }, [])

  const isProductionEnv = useCallback((env: string | null) => {
    // Check if the environment is the default one
    if (!env) return false
    const envInfo = environments?.find(e => e.name === env)
    return envInfo?.isDefault ?? false
  }, [environments])

  const contextValue: EnvironmentContextType = {
    selectedEnvironment,
    setSelectedEnvironment,
    environments: environments ?? [],
    isLoading,
    defaultEnvironment: defaultEnv ?? null,
    isProductionEnv,
  }

  return (
    <EnvironmentContext.Provider value={contextValue}>
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext)
  if (!context) {
    throw new Error("useEnvironment must be used within EnvironmentProvider")
  }
  return context
}

export function useEnvironmentFilter() {
  const { selectedEnvironment } = useEnvironment()
  return selectedEnvironment
}
