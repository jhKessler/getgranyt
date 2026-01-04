import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type CalloutVariant = "tip" | "warning" | "error" | "success" | "info"

interface CalloutProps {
  variant?: CalloutVariant
  className?: string
  children: React.ReactNode
}

const variantConfig = {
  tip: {
    icon: Lightbulb,
    className: "bg-muted/30 border-blue-500/30",
    iconClassName: "text-blue-500",
  },
  info: {
    icon: Info,
    className: "bg-muted/30 border-blue-500/30",
    iconClassName: "text-blue-500",
  },
  warning: {
    icon: AlertCircle,
    className: "border-yellow-500/50",
    iconClassName: "text-yellow-500",
  },
  error: {
    icon: AlertCircle,
    className: "bg-red-500/10 border-red-500/30",
    iconClassName: "text-red-500",
  },
  success: {
    icon: CheckCircle2,
    className: "bg-green-500/10 border-green-500/30",
    iconClassName: "text-green-500",
  },
}

export function Callout({ variant = "tip", className, children }: CalloutProps) {
  const config = variantConfig[variant] || variantConfig.tip
  const Icon = config.icon

  return (
    <Card className={cn(config.className, className)}>
      <CardContent className="pt-4 pb-4">
        <div className="flex gap-2">
          <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconClassName}`} />
          <div className="text-sm text-muted-foreground">{children}</div>
        </div>
      </CardContent>
    </Card>
  )
}
