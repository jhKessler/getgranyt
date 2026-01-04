import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, LucideIcon } from "lucide-react"
import Link from "next/link"

interface LinkCardProps {
  href: string
  title: string
  description: string
  icon?: LucideIcon
}

export function LinkCard({ href, title, description, icon: Icon }: LinkCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            <h3 className="font-semibold">{title}</h3>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export function NavLink({ href, children }: NavLinkProps) {
  return (
    <a 
      href={href}
      className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </a>
  )
}
