"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Highlight, themes } from "prism-react-renderer"

interface StackFrame {
  filename: string
  function: string
  lineno: number
  module?: string
  source_context?: { lineno: number; code: string; current: boolean }[]
  locals?: Record<string, string>
}

interface StacktraceViewProps {
  stacktrace: StackFrame[] | null
}

export function StacktraceView({ stacktrace }: StacktraceViewProps) {
  if (!stacktrace || stacktrace.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        No stacktrace available
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="space-y-3 p-3 font-mono text-sm">
        {stacktrace.toReversed().map((frame, idx) => (
          <StackFrame key={idx} frame={frame} index={stacktrace.length - idx} />
        ))}
      </div>
    </ScrollArea>
  )
}

function StackFrame({ frame, index }: { frame: StackFrame; index: number }) {
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

export type { StackFrame }
