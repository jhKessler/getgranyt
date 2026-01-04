"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  Shield, 
  Menu,
  LucideIcon,
} from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface MobileSidebarProps {
  navigation: NavItem[]
  basePath: string
  variant?: "dashboard" | "demo"
  footer?: React.ReactNode
}

export function MobileSidebar({ 
  navigation, 
  basePath,
  variant = "dashboard",
  footer,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath
    const isExternal = href.startsWith("http")
    if (isExternal) return false
    return pathname.startsWith(href)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold">Granyt</span>
            {variant === "demo" && (
              <Badge variant="secondary" className="ml-auto text-xs">Demo</Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
          {navigation.map((item) => {
            const active = isActive(item.href)
            const isExternal = item.href.startsWith("http")
            return (
              <Link
                key={item.name}
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={() => !isExternal && setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        {footer && (
          <div className="mt-auto border-t p-4">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
