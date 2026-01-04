import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"

interface HighlightCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function HighlightCard({ icon: Icon, title, description }: HighlightCardProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6">
        <Icon className="h-8 w-8 text-primary mb-4" />
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
