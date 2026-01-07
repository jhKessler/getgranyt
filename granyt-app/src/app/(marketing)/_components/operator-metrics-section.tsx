"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Highlight, themes } from "prism-react-renderer"
import { Database, Cloud, Zap, Code2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getDocsLink } from "@/lib/utils"

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

export function OperatorMetricsSection() {
  const operators = [
    {
      title: "SQL & Warehouses",
      icon: <Database className="h-5 w-5 text-blue-500" />,
      items: [
        { name: "Snowflake", href: getDocsLink("/operators/snowflake") },
        { name: "BigQuery", href: getDocsLink("/operators/bigquery") },
        { name: "Redshift", href: getDocsLink("/operators/redshift") },
        { name: "Postgres", href: getDocsLink("/operators/postgres") }
      ]
    },
    {
      title: "Cloud Storage",
      icon: <Cloud className="h-5 w-5 text-sky-500" />,
      items: [
        { name: "AWS S3", href: getDocsLink("/operators/s3") },
        { name: "Google Cloud Storage", href: getDocsLink("/operators/gcs") },
        { name: "Azure Blob", href: getDocsLink("/operators/azure-blob") }
      ]
    },
    {
      title: "Transformation",
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      items: [
        { name: "dbt Cloud", href: getDocsLink("/operators/dbt-cloud") },
        { name: "dbt Core", href: getDocsLink("/operators/dbt-core") },
        { name: "Spark", href: getDocsLink("/operators/spark") },
        { name: "Bash", href: getDocsLink("/operators/bash") }
      ]
    }
  ]

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="outline" className="mb-4">Automatic Insights</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Deep Visibility into Every Operator
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Granyt works with the Airflow lifecycle to automatically capture metrics from Snowflake, BigQuery, S3, dbt, and more. For PythonOperators, simply return your metrics and Granyt handles the rest.
            </p>
            <p className="text-muted-foreground mb-8">
              Need support for a custom operator? You can easily build and register your own adapters to extract any metadata you need. <Link href={getDocsLink("/operators")} className="text-primary hover:underline inline-flex items-center gap-1">Learn more in our docs <ExternalLink className="h-3 w-3" /></Link>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {operators.map((op) => (
                <div key={op.title} className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    {op.icon}
                    <span className="text-sm">{op.title}</span>
                  </div>
                  <ul className="space-y-1">
                    {op.items.map((item) => (
                      <li key={item.name} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <Link href={item.href} className="hover:text-primary hover:underline transition-colors">
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 rounded-3xl blur-2xl" />
            <Card className="relative border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <CodeBlock 
                  code={`@task
def transform_data():
    # Load raw data
    df_raw = pd.read_sql("SELECT * FROM raw_events", conn)
    
    # Return data and metrics via granyt key
    return {
        "granyt": {
            "high_value_orders": (df_raw["amount"] > 1000).sum()
        }
    }`}
                  title="dags/transform_data.py"
                  language="python"
                />
              </CardContent>
            </Card>
            
            <div className="absolute -bottom-6 -right-6 bg-background border border-border p-4 rounded-xl shadow-xl hidden sm:flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Code2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs font-medium">Metrics Captured</p>
                <p className="text-[10px] text-muted-foreground">Automatically linked to task</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
