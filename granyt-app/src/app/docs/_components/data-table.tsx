interface DataTableProps {
  headers: string[]
  rows: (string | React.ReactNode)[][]
  monospaceColumns?: number[]
}

export function DataTable({ headers, rows, monospaceColumns = [] }: DataTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="text-left p-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td 
                  key={cellIndex} 
                  className={`p-3 ${monospaceColumns.includes(cellIndex) ? "font-mono text-xs" : "text-muted-foreground"}`}
                >
                  {monospaceColumns.includes(cellIndex) && typeof cell === "string" ? (
                    <code className="bg-muted px-1.5 py-0.5 rounded">{cell}</code>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { Badge } from "@/components/ui/badge"

interface EnvVarTableProps {
  title?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  envVars: {
    variable: string
    description: string
    default?: string
  }[]
  showDefault?: boolean
}

export function EnvVarTable({ title, badgeVariant = "secondary", envVars, showDefault = false }: EnvVarTableProps) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant={badgeVariant} className="text-xs">{title}</Badge>
        </div>
      )}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Variable</th>
              {showDefault && <th className="text-left p-3 font-medium">Default</th>}
              <th className="text-left p-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {envVars.map((v) => (
              <tr key={v.variable}>
                <td className="p-3">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{v.variable}</code>
                </td>
                {showDefault && (
                  <td className="p-3 font-mono text-xs">{v.default ?? "-"}</td>
                )}
                <td className="p-3 text-muted-foreground">{v.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
