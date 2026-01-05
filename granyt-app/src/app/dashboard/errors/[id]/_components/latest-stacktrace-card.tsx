"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EnvironmentBadge } from "@/components/shared"
import { type StackFrame } from "./stacktrace-view"
import { format } from "date-fns"
import { Clock, FileCode, Layers, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { Highlight, themes } from "prism-react-renderer"

interface Occurrence {
  id: string
  dagId: string | null
  taskId: string | null
  runId: string | null
  dagRunId: string | null
  tryNumber: number | null
  timestamp: string | Date
  stacktrace: StackFrame[] | null
  environment: string | null
}

interface LatestStacktraceCardProps {
  occurrences: Occurrence[]
  basePath?: string
}

const INITIAL_FRAMES_TO_SHOW = 2

export function LatestStacktraceCard({ occurrences, basePath = "/dashboard" }: LatestStacktraceCardProps) {
  const [showAll, setShowAll] = useState(false)
  
  // Get the most recent occurrence with a stacktrace
  const latestOccurrence = useMemo(() => {
    if (!occurrences || occurrences.length === 0) return null
    
    // Sort by timestamp descending and find the first one with a stacktrace
    const sorted = [...occurrences].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    // First try to find one with a stacktrace
    const withStacktrace = sorted.find(o => o.stacktrace && o.stacktrace.length > 0)
    
    // If none have stacktrace, return the most recent anyway
    return withStacktrace || sorted[0]
  }, [occurrences])

  if (!latestOccurrence) {
    return null
  }

  const hasStacktrace = latestOccurrence.stacktrace && latestOccurrence.stacktrace.length > 0
  const stacktrace = latestOccurrence.stacktrace || []
  const reversedStacktrace = [...stacktrace].reverse()
  const totalFrames = stacktrace.length
  const hasMoreFrames = totalFrames > INITIAL_FRAMES_TO_SHOW
  const framesToShow = showAll ? reversedStacktrace : reversedStacktrace.slice(0, INITIAL_FRAMES_TO_SHOW)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Latest Stacktrace
            </CardTitle>
            <CardDescription className="mt-1">
              From the most recent occurrence
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Occurrence metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(latestOccurrence.timestamp), "MMM d, yyyy HH:mm:ss")}</span>
          </div>
          
          {latestOccurrence.dagId && (
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <Link 
                href={`${basePath}/dags/${encodeURIComponent(latestOccurrence.dagId)}`}
                className="text-primary hover:underline"
              >
                {latestOccurrence.dagId}
              </Link>
            </div>
          )}
          
          {latestOccurrence.taskId && (
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-xs">
                Task: {latestOccurrence.taskId}
              </Badge>
            </div>
          )}
          
          {latestOccurrence.environment && (
            <EnvironmentBadge environment={latestOccurrence.environment} variant="muted" />
          )}
          
          {latestOccurrence.tryNumber && latestOccurrence.tryNumber > 1 && (
            <Badge variant="secondary" className="text-xs">
              Try #{latestOccurrence.tryNumber}
            </Badge>
          )}
        </div>
        
        {/* Stacktrace */}
        {hasStacktrace ? (
          <div className="space-y-3">
            <div className="space-y-3 font-mono text-sm">
              {framesToShow.map((frame, idx) => (
                <StackFrameItem 
                  key={idx} 
                  frame={frame} 
                  index={totalFrames - idx} 
                />
              ))}
            </div>
            
            {hasMoreFrames && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show {totalFrames - INITIAL_FRAMES_TO_SHOW} more frame{totalFrames - INITIAL_FRAMES_TO_SHOW !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg bg-muted/30">
            No stacktrace available for this occurrence
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StackFrameItem({ frame, index }: { frame: StackFrame; index: number }) {
  return (
    <div className="border rounded-lg p-2 bg-muted/30">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-muted-foreground text-xs">#{index}</span>
        <span className="font-semibold text-xs">{frame.function}</span>
        {frame.module && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{frame.module}</Badge>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground mb-1 truncate">
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
              
              return (
                <div 
                  key={i} 
                  {...getLineProps({ line: tokenLine })}
                  className={`flex ${originalLine.current ? "bg-destructive/10" : ""}`}
                >
                  <span className="w-12 text-right pr-2 text-muted-foreground border-r select-none shrink-0">
                    {originalLine.lineno}
                  </span>
                  <div className="px-2 flex-1 whitespace-pre overflow-x-auto">
                    {originalLine.current && <span className="text-destructive mr-1">→</span>}
                    {tokenLine.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
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
  return (
    <details className="mt-2">
      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
        Local variables ({Object.keys(locals).length})
      </summary>
      <div className="mt-1 pl-4 text-xs">
        {Object.entries(locals).map(([key, value]) => (
          <div key={key} className="truncate">
            <span className="text-muted-foreground">{key}</span> = {value}
          </div>
        ))}
      </div>
    </details>
  )
}
