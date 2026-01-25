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
