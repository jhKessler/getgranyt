import { PostHog } from "posthog-node"
import { cookies } from "next/headers"
import { env } from "@/env"

const POSTHOG_KEY = env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"

// Cookie name PostHog uses to store the distinct_id
const getPostHogCookieName = () => `ph_${POSTHOG_KEY}_posthog`

function generateDistinctId(): string {
  // Generate a UUID-like string for anonymous users
  return "anon_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export interface BootstrapData {
  distinctID: string
  featureFlags: Record<string, string | boolean>
}

/**
 * Fetches PostHog bootstrap data server-side.
 * This includes the distinct_id and all feature flags for the user.
 * Use this to prevent FOUC (Flash of Unstyled Content) in A/B tests.
 */
export async function getPostHogBootstrapData(): Promise<BootstrapData | null> {
  if (!POSTHOG_KEY) {
    return null
  }

  try {
    const cookieStore = await cookies()
    const phCookie = cookieStore.get(getPostHogCookieName())

    let distinctId: string

    if (phCookie?.value) {
      try {
        const parsed = JSON.parse(phCookie.value)
        distinctId = parsed.distinct_id
      } catch {
        distinctId = generateDistinctId()
      }
    } else {
      distinctId = generateDistinctId()
    }

    const client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // Disable batching for serverless - we want immediate flag evaluation
      flushAt: 1,
      flushInterval: 0,
    })

    const flags = await client.getAllFlags(distinctId)

    // Shutdown the client to flush any pending events
    await client.shutdown()

    return {
      distinctID: distinctId,
      featureFlags: flags,
    }
  } catch (error) {
    console.error("Failed to fetch PostHog bootstrap data:", error)
    return null
  }
}
