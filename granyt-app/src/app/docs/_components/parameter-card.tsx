import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Highlight, themes } from "prism-react-renderer"

interface ParameterCardProps {
  name: string
  required?: boolean
  type: string
  typeLabel?: string
  defaultValue?: string
  defaultNote?: string
  description: React.ReactNode
  example?: string
  exampleLanguage?: string
  children?: React.ReactNode
}

export function ParameterCard({ 
  name, 
  required = false, 
  type, 
  typeLabel,
  defaultValue,
  defaultNote,
  description,
  example,
  exampleLanguage = "python",
  children 
}: ParameterCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <code className="text-lg font-semibold font-mono">{name}</code>
          <Badge variant={required ? "destructive" : "secondary"}>
            {required ? "Required" : "Optional"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <div className="text-sm space-y-2">
          <p>
            <span className="font-medium">Type:</span>{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{type}</code>
            {typeLabel && <span className="text-muted-foreground"> ({typeLabel})</span>}
          </p>
          {defaultValue && (
            <p>
              <span className="font-medium">Default:</span>{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{defaultValue}</code>
              {defaultNote && <span className="text-muted-foreground"> {defaultNote}</span>}
            </p>
          )}
        </div>
        {example && (
          <div className="mt-4 rounded-lg bg-zinc-950 p-3 overflow-x-auto">
            <Highlight
              theme={themes.vsDark}
              code={example}
              language={exampleLanguage}
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
        )}
        {children}
      </CardContent>
    </Card>
  )
}
