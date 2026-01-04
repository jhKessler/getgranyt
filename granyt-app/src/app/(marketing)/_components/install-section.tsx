"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Terminal, Settings } from "lucide-react"
import { Highlight, themes } from "prism-react-renderer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function CodeBlock({ code, title, language = "python" }: { code: string; title: string; language?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border/50 bg-zinc-950">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-zinc-900">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">{title}</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <Highlight
          theme={themes.vsDark}
          code={code}
          language={language}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${className} text-sm`} style={{ ...style, background: 'transparent' }}>
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
        {number < 3 && <div className="w-px flex-1 bg-border mt-2" />}
      </div>
      <div className="pb-8 flex-1">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <p className="text-muted-foreground mb-4">{description}</p>
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
  {
    number: 3,
    icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
    title: "Granyt will now start sending DAG Events",
    description: "Granyt will now start sending DAG Events to your granyt deployment.",
    code: {
      title: "✓ Automatic capture",
      content: `# ✓ DAG run status
# ✓ Task failures with stack traces
# ✓ Execution timing and metadata`,
      language: "python",
    },
  },
]

export function InstallSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          {/* Left: Steps */}
          <div>
            <Badge variant="secondary" className="mb-4">Quick Start</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get started in 5 minutes
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              No code changes required. Install the SDK and you&apos;re ready to go.
            </p>

            <div className="mt-8">
              {steps.map((step) => (
                <Step key={step.number} {...step} />
              ))}
            </div>
          </div>

          {/* Right: Data Metrics */}
          <div className="lg:sticky lg:top-24">
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Example: Data Validation
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Capture metrics before and after a transformation to ensure data integrity. Use the suffix argument to distinguish multiple capture points in one task.
                  </p>
                  
                  <Tabs defaultValue="pandas" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="pandas">Pandas</TabsTrigger>
                      <TabsTrigger value="polars">Polars</TabsTrigger>
                      <TabsTrigger value="pyspark">PySpark</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pandas">
                      <CodeBlock 
                        code={`from airflow.decorators import task
from granyt_sdk import capture_data_metrics
import pandas as pd

@task
def transform_data():
    # Load raw data
    df_raw = pd.read_sql("SELECT * FROM raw_events", conn)
    
    # Capture metrics with a suffix. 
    # The base capture ID is automatically inferred from the Airflow context!
    capture_data_metrics(df_raw, suffix="raw")
    
    # Perform transformation
    df_clean = df_raw.dropna()
    
    # Capture final metrics
    capture_data_metrics(df_clean, suffix="clean")`}
                        title="your_dag.py"
                        language="python"
                      />
                    </TabsContent>
                    <TabsContent value="polars">
                      <CodeBlock 
                        code={`from airflow.decorators import task
from granyt_sdk import capture_data_metrics
import polars as pl

@task
def transform_data():
    # Load raw data
    df_raw = pl.read_database("SELECT * FROM raw_events", conn)
    
    # Capture metrics with a suffix. 
    # The base capture ID is automatically inferred from the Airflow context!
    capture_data_metrics(df_raw, suffix="raw")
    
    # Perform transformation
    df_clean = df_raw.drop_nulls()
    
    # Capture final metrics
    capture_data_metrics(df_clean, suffix="clean")`}
                        title="your_dag.py"
                        language="python"
                      />
                    </TabsContent>
                    <TabsContent value="pyspark">
                      <CodeBlock 
                        code={`from airflow.decorators import task
from granyt_sdk import capture_data_metrics
from pyspark.sql import SparkSession

@task
def transform_data():
    spark = SparkSession.builder.getOrCreate()
    # Load raw data
    df_raw = spark.read.table("raw_events")
    
    # Capture metrics with a suffix. 
    # The base capture ID is automatically inferred from the Airflow context!
    capture_data_metrics(df_raw, suffix="raw")
    
    # Perform transformation
    df_clean = df_raw.dropna()
    
    # Capture final metrics
    capture_data_metrics(df_clean, suffix="clean")`}
                        title="your_dag.py"
                        language="python"
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h4 className="font-medium mb-3">What gets captured automatically:</h4>
                  <ul className="space-y-2">
                    {[
                      "DAG run start, success, and failure events",
                      "Full stack traces with local variables on errors",
                      "Task metadata (run_id, try_number, etc.)",
                      "System info (Python version, hostname)",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
