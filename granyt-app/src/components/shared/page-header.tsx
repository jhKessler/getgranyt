"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
}

export function PageHeader({ title, description, backHref }: PageHeaderProps) {
  return (
    <div className="space-y-1 min-w-0">
      {backHref && (
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      )}
      <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-xs sm:text-base text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
