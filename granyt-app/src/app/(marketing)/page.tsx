import type { Metadata } from "next"
import {
  HeroSection,
  ToolConsolidationSection,
  InstallSection,
  DemoPreviewSection,
  DataValidationSection,
  CTASection,
} from "./_components"
import { getPostHogBootstrapData } from "@/lib/posthog-server"

// Feature flag key for the headline A/B test
const HEADLINE_EXPERIMENT_FLAG = "landing-headline-test"

// Force dynamic rendering since we use cookies for A/B testing
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Granyt - Open Source Data Observability for Apache Airflow",
  description:
    "Monitor your Airflow DAGs, catch errors before they impact your data, and track data quality metrics. Zero-code setup, 100% open source and self-hostable.",
  openGraph: {
    title: "Granyt - Open Source Data Observability for Apache Airflow",
    description:
      "Monitor your Airflow DAGs, catch errors before they impact your data, and track data quality metrics. Zero-code setup, 100% open source and self-hostable.",
    type: "website",
  },
}

export default async function LandingPage() {
  // Fetch PostHog flags server-side to prevent headline flicker
  const bootstrapData = await getPostHogBootstrapData()
  const headlineVariant = bootstrapData?.featureFlags?.[HEADLINE_EXPERIMENT_FLAG] as string | undefined

  return (
    <>
      <HeroSection serverVariant={headlineVariant} />
      <ToolConsolidationSection />
      <InstallSection />
      <DataValidationSection />
      <DemoPreviewSection />
      <CTASection />
    </>
  )
}
