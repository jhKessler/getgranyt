"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Use console.error for client-side error boundary - logger uses server-side env vars
    console.error("Global error:", error)
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
