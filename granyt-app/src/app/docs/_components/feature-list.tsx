import { CheckCircle2 } from "lucide-react"

interface FeatureListProps {
  features: string[]
  columns?: 1 | 2
}

export function FeatureList({ features, columns = 2 }: FeatureListProps) {
  return (
    <div className={`grid gap-3 ${columns === 2 ? "md:grid-cols-2" : ""}`}>
      {features.map((feature) => (
        <div key={feature} className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          <span className="text-muted-foreground">{feature}</span>
        </div>
      ))}
    </div>
  )
}

interface CheckListProps {
  items: React.ReactNode[]
  columns?: 1 | 2
}

export function CheckList({ items, columns = 1 }: CheckListProps) {
  return (
    <ul className={`space-y-3 ${columns === 2 ? "md:grid md:grid-cols-2 md:space-y-0 md:gap-3" : ""}`}>
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  )
}
