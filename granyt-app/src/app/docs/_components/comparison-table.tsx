import { CheckCircle2, XCircle } from "lucide-react"

interface ComparisonRow {
  feature: string
  granyt: boolean | string
  sentry: boolean | string
  grafana: boolean | string
}

interface ComparisonTableProps {
  rows: ComparisonRow[]
}

function CellContent({ value }: { value: boolean | string }) {
  if (value === true) {
    return <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
  }
  if (value === "meh" || value === "Manual setup") {
    return <span className="text-orange-400 text-xs font-medium">{value}</span>
  }
  if (value === false || value === "-") {
    return <XCircle className="h-5 w-5 text-red-400 mx-auto" />
  }
  return <span className="text-muted-foreground text-xs">{value}</span>
}

export function ComparisonTable({ rows }: ComparisonTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium">Feature</th>
            <th className="text-center p-3 font-medium bg-primary/10 border-x border-primary/20">
              <span className="text-primary font-bold">Granyt</span>
            </th>
            <th className="text-center p-3 font-medium">Sentry</th>
            <th className="text-center p-3 font-medium">Grafana</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.feature}>
              <td className="p-3 text-muted-foreground">{row.feature}</td>
              <td className="p-3 text-center bg-primary/5 border-x border-primary/20"><CellContent value={row.granyt} /></td>
              <td className="p-3 text-center"><CellContent value={row.sentry} /></td>
              <td className="p-3 text-center"><CellContent value={row.grafana} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
