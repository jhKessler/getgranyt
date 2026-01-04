"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Github, Sparkles, BookOpen, Copy, Check } from "lucide-react"
import { INSTALL_COMMAND, GITHUB_URL } from "@/lib/constants"
import { useFeatureFlagVariantKey, usePostHog } from "posthog-js/react"

// Feature flag key for the headline A/B test
const HEADLINE_EXPERIMENT_FLAG = "landing-headline-test"

function InstallCommand({ onCopy }: { onCopy: () => void }) {
  const command = INSTALL_COMMAND
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    onCopy()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 bg-zinc-950 border border-border/50 rounded-lg px-3 sm:px-4 py-3 font-mono text-sm max-w-full overflow-x-auto">
      <code className="text-green-400 whitespace-nowrap text-xs sm:text-sm">{command}</code>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

function HeadlineControl() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
        Pipeline Monitoring{" "}
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          you&apos;ll actually use
        </span>
      </h1>
      <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
        Rock-solid Airflow monitoring built for data engineers. <br className="hidden sm:block" /> Not for sales demos.
      </p>
    </>
  )
}

function HeadlineTest() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
        Observability for{" "}
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Apache Airflow
        </span>
      </h1>
      <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
        Open source, self-hosted monitoring for your DAGs. <br className="hidden sm:block" /> 
        Capture errors, metrics, and data flow with zero-code instrumentation.
      </p>
    </>
  )
}

interface HeroSectionProps {
  /** Server-side evaluated variant to prevent FOUC. Falls back to client-side if not provided. */
  serverVariant?: string
}

export function HeroSection({ serverVariant }: HeroSectionProps) {
  const posthog = usePostHog()
  // Use server variant if available, otherwise fall back to client-side evaluation
  const clientVariant = useFeatureFlagVariantKey(HEADLINE_EXPERIMENT_FLAG)
  const variant = serverVariant ?? clientVariant

  // Determine which headline to show
  // - "test" → show test headline
  // - "control" → show control headline  
  // - undefined/null → flags loading, default to control (but don't track as control)
  const showTestHeadline = variant === "test"
  const flagsLoaded = variant !== undefined && variant !== null

  // Track CTA clicks - only include variant if flags are loaded
  const trackCurlCopy = () => {
    posthog?.capture("landing_curl_copied", {
      experiment_variant: flagsLoaded ? variant : "unknown",
    })
  }

  const trackDocsClick = () => {
    posthog?.capture("landing_docs_clicked", {
      experiment_variant: flagsLoaded ? variant : "unknown",
    })
  }

  const trackGithubClick = () => {
    posthog?.capture("landing_github_clicked", {
      experiment_variant: flagsLoaded ? variant : "unknown",
    })
  }

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>


      <div className="container mx-auto max-w-6xl px-4 py-24 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Badge */}
          <Link
            href={GITHUB_URL}
            target="_blank"
            className="group"
            onClick={trackGithubClick}
          >
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm hover:bg-secondary/80 transition-colors cursor-pointer">
              <Sparkles className="h-4 w-4" />
              <span>100% Open Source</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Badge>
          </Link>

          {/* Main heading - A/B tested */}
          <div className="space-y-4 max-w-4xl px-2">
            {showTestHeadline ? <HeadlineTest /> : <HeadlineControl />}
          </div>

          {/* Primary CTA - Install command */}
          <InstallCommand onCopy={trackCurlCopy} />

          {/* Secondary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="gap-2 text-base">
              <Link
                href="/docs"
                onClick={trackDocsClick}
              >
                <BookOpen className="h-4 w-4" />
                Docs
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 text-base">
              <Link
                href={GITHUB_URL}
                target="_blank"
                onClick={trackGithubClick}
              >
                <Github className="h-4 w-4" />
                Star on GitHub
              </Link>
            </Button>
          </div>

          {/* Quick value props */}
          <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>100% Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Self-Hosted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>5-minute install</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
