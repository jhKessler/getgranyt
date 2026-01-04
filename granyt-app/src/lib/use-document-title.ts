"use client"

import { useEffect } from "react"

const BASE_TITLE = "Granyt"

/**
 * Hook to dynamically update the document title
 * @param title - The page-specific title (will be prefixed with the page title)
 * @example useDocumentTitle("DAGs") // Sets title to "DAGs | Granyt"
 * @example useDocumentTitle("my_dag", "DAG") // Sets title to "my_dag - DAG | Granyt"
 */
export function useDocumentTitle(title: string, subtitle?: string) {
  useEffect(() => {
    const parts = [title]
    if (subtitle) {
      parts.unshift(subtitle)
    }
    parts.push(BASE_TITLE)
    
    // Format: "Subtitle - Title | Granyt" or "Title | Granyt"
    const fullTitle = subtitle 
      ? `${subtitle} - ${title} | ${BASE_TITLE}`
      : `${title} | ${BASE_TITLE}`
    
    document.title = fullTitle
    
    // Cleanup: reset to base title when component unmounts
    return () => {
      document.title = `${BASE_TITLE} - Data Observability Platform`
    }
  }, [title, subtitle])
}
