"use client"

import { useDocumentTitle } from "@/lib/use-document-title"
import { useApiKeysPage } from "./_hooks"
import { ApiKeysContent } from "./_components"

export default function ApiKeysPage() {
  useDocumentTitle("API Keys")
  const pageData = useApiKeysPage()

  return <ApiKeysContent {...pageData} />
}
