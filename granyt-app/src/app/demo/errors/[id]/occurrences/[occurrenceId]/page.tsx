"use client"

import { use, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EnvironmentBadge } from "@/components/shared"
import { ArrowLeft, Clock, FileCode, Layers, Hash, RotateCcw, ExternalLink } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Highlight, themes } from "prism-react-renderer"
import { mockErrorDetails } from "../../../../_data/mock-data"

interface StackFrame {
  filename: string
  lineno: number
  function: string
  module?: string
  source_context?: { lineno: number; code: string; current: boolean }[]
  locals?: Record<string, string>
}

export default function DemoOccurrenceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; occurrenceId: string }> 
}) {
  const resolvedParams = use(params)
  const errorId = resolvedParams.id
  const occurrenceId = resolvedParams.occurrenceId
  
  // Find the occurrence in mock data
  const occurrence = useMemo(() => {
    const errorDetails = mockErrorDetails[errorId]
    if (!errorDetails?.occurrences) return null
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (errorDetails.occurrences as any[]).find(o => o.id === occurrenceId) || null
  }, [errorId, occurrenceId])
  
  // Get error details for header
  const errorDetails = mockErrorDetails[errorId]

  if (!occurrence) {
    return <OccurrenceNotFound errorId={errorId} />
  }

  const stacktrace = (occurrence.stacktrace as StackFrame[]) || []
  const reversedStacktrace = [...stacktrace].reverse()

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/demo/errors/${errorId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Error
        </Link>
      </Button>

      {/* Occurrence Header - uses amber accent for visual distinction */}
      <Card className="border-l-4 border-l-amber-500 dark:border-l-amber-400">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                  <Hash className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                Error Occurrence
              </CardTitle>
              <CardDescription className="text-sm">
                Single instance of{" "}
                <Link 
                  href={`/demo/errors/${errorId}`}
                  className="text-primary hover:underline font-medium"
                >
                  {errorDetails?.exceptionType || "Unknown Error"}
                </Link>
              </CardDescription>
            </div>
            {occurrence.environment && (
              <EnvironmentBadge environment={occurrence.environment} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetadataItem 
              icon={<Clock className="h-4 w-4" />}
              label="Occurred At"
              value={format(new Date(occurrence.timestamp), "MMM d, yyyy HH:mm:ss")}
            />
            
            {occurrence.dagId && (
              <MetadataItem 
                icon={<FileCode className="h-4 w-4" />}
                label="DAG"
                value={
                  <Link 
                    href={`/demo/dags/${encodeURIComponent(occurrence.dagId)}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {occurrence.dagId}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                }
              />
            )}
            
            {occurrence.taskId && (
              <MetadataItem 
                icon={<Layers className="h-4 w-4" />}
                label="Task"
                value={occurrence.taskId}
              />
            )}
            
            {occurrence.tryNumber && (
              <MetadataItem 
                icon={<RotateCcw className="h-4 w-4" />}
                label="Try Number"
                value={
                  <Badge variant={occurrence.tryNumber > 1 ? "secondary" : "outline"}>
                    #{occurrence.tryNumber}
                  </Badge>
                }
              />
            )}
          </div>
          
          {/* Run ID if available */}
          {occurrence.runId && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground mb-1">Run ID</div>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                  {occurrence.runId}
                </code>
                {occurrence.dagRunId && occurrence.dagId && (
                  <Button variant="outline" size="sm" asChild>
                    <Link 
                      href={`/demo/dags/${encodeURIComponent(occurrence.dagId)}/runs/${occurrence.dagRunId}`}
                    >
                      View Run
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Stacktrace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Full Stacktrace
          </CardTitle>
          <CardDescription>
            {stacktrace.length} frame{stacktrace.length !== 1 ? "s" : ""} • Most recent call last
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stacktrace.length > 0 ? (
            <div className="space-y-3 font-mono text-sm">
              {reversedStacktrace.map((frame, idx) => (
                <StackFrameItem 
                  key={idx} 
                  frame={frame} 
                  index={stacktrace.length - idx} 
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-8 text-center border rounded-lg bg-muted/30">
              No stacktrace available for this occurrence
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetadataItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

function StackFrameItem({ frame, index }: { frame: StackFrame; index: number }) {
  return (
    <div className="border rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs font-mono">#{index}</Badge>
        <span className="font-semibold">{frame.function}</span>
        {frame.module && (
          <Badge variant="secondary" className="text-xs">{frame.module}</Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground mb-2 font-mono">
        {frame.filename}:{frame.lineno}
      </div>
      
      {frame.source_context && frame.source_context.length > 0 && (
        <SourceContext lines={frame.source_context} />
      )}
      
      {frame.locals && Object.keys(frame.locals).length > 0 && (
        <LocalVariables locals={frame.locals} />
      )}
    </div>
  )
}

function SourceContext({ lines }: { lines: { lineno: number; code: string; current: boolean }[] }) {
  const fullCode = lines.map(l => l.code).join('\n')

  return (
    <div className="bg-background rounded border overflow-hidden mt-2">
      <Highlight
        theme={themes.vsDark}
        code={fullCode}
        language="python"
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} text-sm`} style={{ ...style, background: 'transparent' }}>
            {tokens.map((tokenLine, i) => {
              const originalLine = lines[i]
              if (!originalLine) return null
              
              const isCurrent = originalLine.current
              const lineProps = getLineProps({ line: tokenLine })
              
              return (
                <div 
                  key={i} 
                  {...lineProps}
                  className={`px-3 py-0.5 flex ${isCurrent ? 'bg-red-500/20 border-l-2 border-l-red-500' : ''}`}
                >
                  <span className="select-none text-muted-foreground w-10 shrink-0 text-right pr-3 text-xs">
                    {originalLine.lineno}
                  </span>
                  <span className="flex-1">
                    {tokenLine.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              )
            })}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

function LocalVariables({ locals }: { locals: Record<string, string> }) {
  const entries = Object.entries(locals)
  if (entries.length === 0) return null
  
  return (
    <div className="mt-2 p-2 bg-background rounded border">
      <div className="text-xs font-medium text-muted-foreground mb-1">Local Variables</div>
      <div className="grid gap-1">
        {entries.map(([name, value]) => (
          <div key={name} className="flex items-start gap-2 text-xs font-mono">
            <span className="text-blue-500 shrink-0">{name}</span>
            <span className="text-muted-foreground">=</span>
            <span className="text-foreground break-all">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OccurrenceNotFound({ errorId }: { errorId: string }) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/demo/errors/${errorId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Error
        </Link>
      </Button>
      
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Hash className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Occurrence Not Found</h2>
          <p className="text-muted-foreground text-center max-w-md">
            This error occurrence is not available in the demo data.
          </p>
          <Button asChild className="mt-6">
            <Link href={`/demo/errors/${errorId}`}>
              Return to Error Details
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
