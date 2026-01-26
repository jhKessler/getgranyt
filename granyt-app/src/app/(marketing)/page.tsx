import type { Metadata } from "next"
import {
  HeroSection,
  ToolConsolidationSection,
  InstallSection,
  DemoPreviewSection,
  OperatorMetricsSection,
  CTASection,
  FadeIn,
} from "./_components"

export const metadata: Metadata = {
  title: "Granyt - Open Source Airflow Observability",
  description:
    "Stop finding out your DAG failed from Slack messages. Error tracking, metrics, and alerts that understand your pipelines. Self-hosted, 5 min setup.",
  openGraph: {
    title: "Granyt - Open Source Airflow Observability",
    description:
      "Stop finding out your DAG failed from Slack messages. Error tracking, metrics, and alerts that understand your pipelines. Self-hosted, 5 min setup.",
    type: "website",
  },
}

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FadeIn>
        <OperatorMetricsSection />
      </FadeIn>
      <FadeIn>
        <ToolConsolidationSection />
      </FadeIn>
      <FadeIn>
        <InstallSection />
      </FadeIn>
      <FadeIn>
        <DemoPreviewSection />
      </FadeIn>
      <FadeIn>
        <CTASection />
      </FadeIn>
    </>
  )
}
