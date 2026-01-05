"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBreadcrumbContext } from "@/lib/breadcrumb-context"

interface BreadcrumbSegment {
  label: string
  href: string
  isCurrentPage?: boolean
}

// Maps route segments to display labels
const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  dags: "DAGs",
  runs: "Runs",
  alerts: "Alerts",
  errors: "Errors",
  apikeys: "API Keys",
  settings: "Settings",
  default: "Default Errors",
  "non-default": "Non-Default Errors",
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

function formatDynamicSegment(segment: string, previousSegment?: string): string {
  // Decode URI component for display
  const decoded = decodeURIComponent(segment)
  
  // If it looks like a UUID, shorten it
  if (isUUID(decoded)) {
    return decoded.slice(0, 8) + "..."
  }
  
  // For DAG IDs and other identifiers, just return the decoded value
  return decoded
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const { overrides } = useBreadcrumbContext()
  
  const segments = pathname.split("/").filter(Boolean)
  
  const breadcrumbs: BreadcrumbSegment[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const isCurrentPage = index === segments.length - 1
    const previousSegment = index > 0 ? segments[index - 1] : undefined
    
    // Check for context override first (e.g., for srcRunId display)
    const decodedSegment = decodeURIComponent(segment)
    const override = overrides.get(decodedSegment)
    
    // Check if this is a known segment
    const knownLabel = segmentLabels[segment]
    
    // Determine label: override > known label > formatted dynamic segment
    let label: string
    if (override) {
      label = override
    } else if (knownLabel) {
      label = knownLabel
    } else {
      // Dynamic segment (DAG ID, Alert ID, Run ID, Error ID, etc.)
      label = formatDynamicSegment(segment, previousSegment)
    }
    
    return {
      label,
      href,
      isCurrentPage,
    }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            {crumb.isCurrentPage ? (
              <span 
                className={cn(
                  "font-medium text-foreground truncate max-w-[200px]",
                  index === 0 && "flex items-center gap-1"
                )}
                title={crumb.label}
              >
                {index === 0 && <Home className="h-3.5 w-3.5 flex-shrink-0" />}
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  "hover:text-foreground transition-colors truncate max-w-[200px]",
                  index === 0 && "flex items-center gap-1"
                )}
                title={crumb.label}
              >
                {index === 0 && <Home className="h-3.5 w-3.5 flex-shrink-0" />}
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
