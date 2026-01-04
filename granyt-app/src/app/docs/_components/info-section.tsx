import { type LucideIcon } from "lucide-react"

interface InfoSectionProps {
  icon?: LucideIcon
  title: string
  description?: string
  children: React.ReactNode
}

export function InfoSection({ icon: Icon, title, description, children }: InfoSectionProps) {
  return (
    <section className="rounded-lg border bg-muted/30 p-6 space-y-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-6 w-6" />}
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {description && <p className="text-muted-foreground">{description}</p>}
      {children}
    </section>
  )
}
