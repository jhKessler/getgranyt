import { Badge } from "@/components/ui/badge"
import { type LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon?: LucideIcon
  title: string
  tagline?: string
  description: string
  badge?: string
}

export function PageHeader({ icon: Icon, title, tagline, description, badge }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {Icon && <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary shrink-0" />}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        {badge && <Badge variant="secondary" className="ml-2">{badge}</Badge>}
      </div>
      {tagline && (
        <p className="text-xl sm:text-2xl font-semibold text-primary">{tagline}</p>
      )}
      <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">{description}</p>
    </div>
  )
}
