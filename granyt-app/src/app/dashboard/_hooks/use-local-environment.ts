"use client"

import { useState } from "react"
import { useEnvironment } from "@/lib/environment-context"

export function useLocalEnvironment(defaultToFirst = false) {
  const { environments, defaultEnvironment, isLoading } = useEnvironment()
  
  const initialValue = defaultToFirst && environments.length > 0 
    ? environments[0].name 
    : defaultEnvironment
  
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(initialValue)
  
  // Update when environments load
  if (!isLoading && selectedEnvironment === null && defaultToFirst && environments.length > 0) {
    setSelectedEnvironment(environments[0].name)
  }

  return {
    selectedEnvironment,
    setSelectedEnvironment,
    environments,
    isLoading,
  }
}
