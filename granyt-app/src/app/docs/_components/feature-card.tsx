import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  details?: string[]
  variant?: "default" | "muted"
}

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  details,
  variant = "default" 
}: FeatureCardProps) {
  if (details) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 md:grid-cols-2">
            {details.map((detail) => (
              <li key={detail} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={variant === "muted" ? "bg-muted/30" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface IconFeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function IconFeatureCard({ icon: Icon, title, description }: IconFeatureCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Icon className="h-8 w-8 text-primary mb-3" />
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
