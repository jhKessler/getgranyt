"use client"

import Link from "next/link"
import { useDocumentTitle } from "@/lib/use-document-title"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  useDocumentTitle("Page Not Found")
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground mt-2">Page not found</p>
      <Button asChild className="mt-4">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  )
}
