"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, ChevronUp, AlertCircle, ExternalLink } from "lucide-react"
import { Highlight, themes } from "prism-react-renderer"
import Link from "next/link"

interface StackFrame {
  filename: string
  lineno: number
  function: string
  module?: string
  source_context?: { lineno: number; code: string; current: boolean }[]
  locals?: Record<string, string>
}

interface ErrorOccurrence {
  id: string
  taskId: string | null
  exceptionType: string
  message: string
  errorId: string
  timestamp: Date
  tryNumber: number | null
  operator: string | null
  stacktrace: unknown
}

interface RunStacktraceCardProps {
  occurrences: ErrorOccurrence[]
  basePath?: string
}

const INITIAL_FRAMES_TO_SHOW = 2

export function RunStacktraceCard({ occurrences, basePath = "/dashboard" }: RunStacktraceCardProps) {
  if (!occurrences || occurrences.length === 0) {
    return null
  }

  // Group occurrences by task
  const occurrencesByTask = new Map<string, ErrorOccurrence[]>()
  for (const occurrence of occurrences) {
    const taskId = occurrence.taskId || "unknown"
    if (!occurrencesByTask.has(taskId)) {
      occurrencesByTask.set(taskId, [])
    }
    occurrencesByTask.get(taskId)!.push(occurrence)
  }

  const tasks = Array.from(occurrencesByTask.keys())
  const hasTabs = tasks.length > 1

  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Error Stacktrace{occurrences.length > 1 ? "s" : ""}
        </CardTitle>
        <CardDescription>
          {occurrences.length} error{occurrences.length !== 1 ? "s" : ""} from this run
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasTabs ? (
          <Tabs defaultValue={tasks[0]} className="w-full">
            <TabsList className="mb-4">
              {tasks.map((taskId) => (
                <TabsTrigger key={taskId} value={taskId} className="gap-2">
                  {taskId}
                  <Badge variant="secondary" className="text-xs">
                    {occurrencesByTask.get(taskId)!.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {tasks.map((taskId) => (
              <TabsContent key={taskId} value={taskId}>
                <TaskErrorsList 
                  occurrences={occurrencesByTask.get(taskId)!} 
                  basePath={basePath}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <TaskErrorsList occurrences={occurrences} basePath={basePath} />
        )}
      </CardContent>
    </Card>
  )
}

function TaskErrorsList({ 
  occurrences, 
  basePath 
}: { 
  occurrences: ErrorOccurrence[]
  basePath: string 
}) {
  return (
    <div className="space-y-4">
      {occurrences.map((occurrence) => (
        <SingleErrorStacktrace 
          key={occurrence.id} 
          occurrence={occurrence} 
          basePath={basePath}
        />
      ))}
    </div>
  )
}

function SingleErrorStacktrace({ 
  occurrence, 
  basePath 
}: { 
  occurrence: ErrorOccurrence
  basePath: string 
}) {
  const [showAll, setShowAll] = useState(false)
  
  // Parse stacktrace
  const rawStacktrace = occurrence.stacktrace
  const stacktrace: StackFrame[] = Array.isArray(rawStacktrace) ? rawStacktrace : []
  const reversedStacktrace = [...stacktrace].reverse()
  const totalFrames = stacktrace.length
  const hasMoreFrames = totalFrames > INITIAL_FRAMES_TO_SHOW
  const framesToShow = showAll ? reversedStacktrace : reversedStacktrace.slice(0, INITIAL_FRAMES_TO_SHOW)

  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      {/* Error header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="destructive" className="text-xs">
              {occurrence.exceptionType}
            </Badge>
            {occurrence.tryNumber && occurrence.tryNumber > 1 && (
              <Badge variant="secondary" className="text-xs">
                Try #{occurrence.tryNumber}
              </Badge>
            )}
            {occurrence.operator && (
              <Badge variant="outline" className="text-xs">
                {occurrence.operator}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {occurrence.message}
          </p>
        </div>
        <Button variant="destructive" size="sm" asChild>
          <Link href={`${basePath}/errors/${occurrence.errorId}`}>
            View Error
            <ExternalLink className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Stacktrace frames */}
      {stacktrace.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-2 font-mono text-sm">
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
          No stacktrace available
        </div>
      )}
    </div>
  )
}

function StackFrameItem({ frame, index }: { frame: StackFrame; index: number }) {
  return (
    <div className="border rounded-lg p-2 bg-background">
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
