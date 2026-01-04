import { Badge } from "@/components/ui/badge"
import { type LucideIcon } from "lucide-react"

interface SectionHeaderProps {
  icon?: LucideIcon
  title: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  description?: string
}

export function SectionHeader({ 
  icon: Icon, 
  title, 
  badge, 
  badgeVariant = "secondary",
  description 
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      )}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        </div>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}
