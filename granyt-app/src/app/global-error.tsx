"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground mt-2">
            {error.message || "An unexpected error occurred"}
          </p>
          <Button onClick={() => reset()} className="mt-4">
            Try again
          </Button>
        </div>
      </body>
    </html>
  )
}
