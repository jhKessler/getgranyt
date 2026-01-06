"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Terminal, Settings } from "lucide-react"
import { Highlight, themes } from "prism-react-renderer"

function CodeBlock({ code, title, language = "python" }: { code: string; title: string; language?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border/50 bg-zinc-950 w-full max-w-full">
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-border/50 bg-zinc-900">
        <div className="flex gap-1.5 shrink-0">
          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500/80" />
          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500/80" />
          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground ml-2 truncate">{title}</span>
      </div>
      <div className="p-3 sm:p-4 overflow-x-auto">
        <Highlight
          theme={themes.vsDark}
          code={code}
          language={language}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${className} text-xs sm:text-sm`} style={{ ...style, background: 'transparent' }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  )
}

interface StepProps {
  number: number
  icon: React.ReactNode
  title: string
  description: string
  code?: { title: string; content: string; language?: string }
}

function Step({ number, icon, title, description, code }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
          {number}
        </div>
        {number < 2 && <div className="w-px flex-1 bg-border mt-2" />}
      </div>
      <div className="pb-8 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">{description}</p>
        {code && <CodeBlock code={code.content} title={code.title} language={code.language} />}
      </div>
    </div>
  )
}

const steps: StepProps[] = [
  {
    number: 1,
    icon: <Terminal className="h-5 w-5 text-primary" />,
    title: "Install the SDK",
    description: "Add the Granyt SDK to your Airflow environment with a single pip install.",
    code: {
      title: "terminal",
      content: "pip install granyt-sdk",
      language: "bash",
    },
  },
  {
    number: 2,
    icon: <Settings className="h-5 w-5 text-primary" />,
    title: "Set Environment Variables",
    description: "Configure your endpoint and API key. Get your key from the Granyt dashboard.",
    code: {
      title: "airflow.env",
      content: `export GRANYT_ENDPOINT="https://granyt.yourdomain.com"
export GRANYT_API_KEY="your-api-key"`,
      language: "bash",
    },
  },
]

export function InstallSection() {
  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4 overflow-hidden">
        <div className="text-center mb-10 md:mb-16">
          <Badge variant="secondary" className="mb-4">Quick Start</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Get started in 5 minutes
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            No code changes required. Install the SDK and you&apos;re ready to go.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Works with Airflow 2.5 – 2.10 • Airflow 3.0 support coming soon
          </p>
        </div>

        <div className="grid gap-8 md:gap-16 lg:grid-cols-2 items-start">
          {/* Left: Steps */}
          <div className="space-y-8 min-w-0 overflow-hidden">
            {steps.map((step) => (
              <Step key={step.number} {...step} />
            ))}
          </div>

          {/* Right: DAG Events */}
          <Card className="border-border/50 bg-muted/30 min-w-0 overflow-hidden">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-start sm:items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
                <h3 className="font-semibold text-base sm:text-lg">
                  Granyt will now start sending DAG Events
                </h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Granyt will now start sending DAG Events to your granyt deployment.
              </p>
              <CodeBlock 
                code={`# ✓ DAG run status
# ✓ Task failures with stack traces
# ✓ Execution timing and metadata
# ✓ Additional metrics for popular operators
# ✓ Your own custom metrics`}
                title="✓ Automatic capture"
                language="python"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
