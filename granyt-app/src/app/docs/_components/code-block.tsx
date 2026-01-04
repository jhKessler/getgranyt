import { Highlight, themes } from "prism-react-renderer"

interface CodeBlockProps {
  code: string
  language?: string
  variant?: "default" | "error"
  inline?: boolean
  className?: string
  title?: string
}

export function CodeBlock({ code, language = "python", variant = "default", inline = false, className, title }: CodeBlockProps) {
  const colorClass = variant === "error" ? "text-red-400" : "text-green-400"
  
  if (inline) {
    return (
      <div className={`rounded-lg bg-zinc-950 p-3 overflow-x-auto ${className ?? ""}`}>
        <code className={`text-xs ${colorClass}`}>{code}</code>
      </div>
    )
  }
  
  return (
    <div className={`rounded-lg bg-zinc-950 overflow-hidden border border-zinc-800 ${className ?? ""}`}>
      {title && (
        <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">{title}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{language}</span>
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <Highlight
          theme={themes.vsDark}
          code={code}
          language={language}
        >
          {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${highlightClassName} text-sm`} style={{ ...style, background: 'transparent' }}>
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

interface InlineCodeProps {
  children: React.ReactNode
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{children}</code>
  )
}
