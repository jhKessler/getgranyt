import type { Metadata } from "next"
import "@/styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TRPCProvider } from "@/lib/trpc"
import { Toaster } from "@/components/ui/sonner"
import { PostHogProvider } from "@/lib/posthog"

export const metadata: Metadata = {
  title: {
    default: "Granyt - Data Observability Platform",
    template: "%s | Granyt",
  },
  description: "Monitor and protect your Airflow DAGs with Granyt",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <TRPCProvider>
              {children}
              <Toaster />
            </TRPCProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
