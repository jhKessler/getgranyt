"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense, useRef } from "react"
import { env } from "@/env"

const POSTHOG_KEY = env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
const GRANYT_MODE = env.NEXT_PUBLIC_GRANYT_MODE?.toUpperCase()

// PostHog is only enabled in DOCS mode for pageviews and session replay
const IS_POSTHOG_ENABLED = GRANYT_MODE === "DOCS" && !!POSTHOG_KEY

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthogClient = usePostHog()

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthogClient.capture("$pageview", { $current_url: url })
    }
  }, [pathname, searchParams, posthogClient])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!IS_POSTHOG_ENABLED || initialized.current) return
    initialized.current = true

    posthog.init(POSTHOG_KEY!, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false, // We'll capture manually for SPA navigation
      capture_pageleave: true, // Track time on page automatically
      autocapture: false, // Disable autocapture - only pageviews and session replay
      // Filter events to only allow pageviews and session replay
      before_send: (event) => {
        if (!event) return null
        const allowedEvents = [
          "$pageview",
          "$pageleave",
          "$snapshot", // Session replay
          "$performance_event",
          "$feature_flag_called", // Required for A/B tests
        ]
        if (!allowedEvents.includes(event.event)) {
          return null // Drop all other events
        }
        return event
      },
    })
  }, [])

  if (!IS_POSTHOG_ENABLED) {
    // If PostHog is not enabled, just render children
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}

// Export posthog instance for direct usage
export { posthog }
