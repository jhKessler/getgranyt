"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function DataValidationSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto max-w-4xl px-4 overflow-hidden">
        <div className="text-center mb-8 md:mb-12">
          <Badge variant="outline" className="mb-4">Advanced Usage</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Deep Data Validation
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            While Granyt works automatically, you can use the SDK to capture custom metrics and ensure data integrity across your transformations.
          </p>
        </div>

        <Card className="border-border/50 bg-background min-w-0 overflow-hidden">
          <CardContent className="p-4 sm:p-6 min-w-0 overflow-hidden">
            <p className="text-muted-foreground text-sm mb-6">
              Capture metrics before and after a transformation to ensure data integrity. Use the suffix and custom_metrics arguments to distinguish multiple capture points and track business-specific KPIs.
            </p>
            
            <Tabs defaultValue="pandas" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
                <TabsTrigger value="pandas" className="text-xs sm:text-sm">Pandas</TabsTrigger>
                <TabsTrigger value="polars" className="text-xs sm:text-sm">Polars</TabsTrigger>
                <TabsTrigger value="pyspark" className="text-xs sm:text-sm">PySpark</TabsTrigger>
              </TabsList>
              <TabsContent value="pandas">
                <CodeBlock 
                  code={`from airflow.decorators import task
from granyt_sdk import compute_df_metrics
import pandas as pd

@task
def transform_data():
    # Load raw data
    df_raw = pd.read_sql("SELECT * FROM raw_events", conn)
    
    # Perform transformation
    df_clean = df_raw.dropna()
    
    # Compute metrics with custom business KPIs
    metrics = compute_df_metrics(df_clean)
    
    # Return data and metrics via granyt_metrics
    return {
        "data": df_clean.to_dict(),
        "granyt_metrics": {
            **metrics,
            "high_value_orders": len(df_clean[df_clean["amount"] > 1000])
        }
    }`}
                  title="your_dag.py"
                  language="python"
                />
              </TabsContent>
              <TabsContent value="polars">
                <CodeBlock 
                  code={`from airflow.decorators import task
from granyt_sdk import compute_df_metrics
import polars as pl

@task
def transform_data():
    # Load raw data
    df_raw = pl.read_database("SELECT * FROM raw_events", conn)
    
    # Perform transformation
    df_clean = df_raw.drop_nulls()
    
    # Compute metrics with custom business KPIs
    metrics = compute_df_metrics(df_clean)
    
    # Return data and metrics via granyt_metrics
    return {
        "data": df_clean.to_dicts(),
        "granyt_metrics": {
            **metrics,
            "high_value_orders": df_clean.filter(pl.col("amount") > 1000).height
        }
    }`}
                  title="your_dag.py"
                  language="python"
                />
              </TabsContent>
              <TabsContent value="pyspark">
                <CodeBlock 
                  code={`from airflow.decorators import task
from granyt_sdk import compute_df_metrics
from pyspark.sql import SparkSession

@task
def transform_data():
    spark = SparkSession.builder.getOrCreate()
    # Load raw data
    df_raw = spark.read.table("raw_events")
    
    # Perform transformation
    df_clean = df_raw.dropna()
    
    # Compute metrics with custom business KPIs
    metrics = compute_df_metrics(df_clean)
    
    # Return metrics via granyt_metrics
    return {
        "granyt_metrics": {
            **metrics,
            "high_value_orders": df_clean.filter(df_clean["amount"] > 1000).count()
        }
    }`}
                  title="your_dag.py"
                  language="python"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
