import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"

interface SectionCardProps {
  icon: LucideIcon
  title: string
  description?: string
  href?: string
}

export function SectionCard({ icon: Icon, title, description, href }: SectionCardProps) {
  const content = (
    <Card className="h-full bg-muted/30 hover:bg-muted/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <a href={href} className="block">{content}</a>
  }

  return content
}

interface FeatureSectionProps {
  id: string
  icon: LucideIcon
  title: string
  description: string
  features: { title: string; description: string }[]
}

export function FeatureSection({ id, icon: Icon, title, description, features }: FeatureSectionProps) {
  return (
    <section id={id} className="space-y-6 scroll-mt-20">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} className="bg-muted/30">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
