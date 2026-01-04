"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn, getDocsLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileSidebar, type NavItem } from "@/components/shared"
import { 
  Shield, 
  LayoutDashboard, 
  Plug, 
  AlertTriangle, 
  GitBranch, 
  Play, 
  Bell, 
  Settings,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { EnvironmentProvider } from "@/lib/environment-context"

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/demo", icon: LayoutDashboard },
  { name: "DAGs", href: "/demo/dags", icon: GitBranch },
  { name: "Runs", href: "/demo/runs", icon: Play },
  { name: "Alerts", href: "/demo/alerts", icon: Bell },
  { name: "Errors", href: "/demo/errors", icon: AlertTriangle },
  { name: "API Keys", href: "/demo/apikeys", icon: Plug },
  { name: "Settings", href: "/demo/settings", icon: Settings },
]

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="bg-primary text-primary-foreground px-3 py-2 text-center text-sm">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">You&apos;re viewing a demo with sample data.</span>
          <span className="sm:hidden">Demo mode</span>
          <Link href="/register" className="underline underline-offset-2 font-medium hover:opacity-80">
            <span className="hidden sm:inline">Spin up your own instance</span>
            <span className="sm:hidden">Sign up</span>
          </Link>
          <ArrowRight className="h-3 w-3 shrink-0" />
        </div>
      </div>

      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-card mt-[40px] hidden md:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <Link href="/" className="flex h-16 items-center gap-2 px-6 border-b">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Granyt</span>
            <Badge variant="secondary" className="ml-auto text-xs">Demo</Badge>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = item.href === "/demo" 
                ? pathname === "/demo"
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
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

          {/* CTA section */}
          <div className="border-t p-4 space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Like what you see?
            </p>
            <Button asChild className="w-full" size="sm">
              <Link href="/register">
                Spin up your own instance
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link 
                href={getDocsLink("", "demo-sidebar")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the Docs
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:pl-64 pt-[40px]">
        {/* Header */}
        <header className="sticky top-[40px] z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3 md:hidden">
            <MobileSidebar 
              navigation={navigation} 
              basePath="/demo"
              variant="demo"
              footer={
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Like what you see?
                  </p>
                  <Button asChild className="w-full" size="sm">
                    <Link href="/register">
                      Sign up
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              }
            />
            <Link href="/demo" className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold">Granyt</span>
              <Badge variant="secondary" className="text-xs">Demo</Badge>
            </Link>
          </div>
          {/* Desktop: empty space on left, toggle on right */}
          <div className="hidden md:block" />
          <ModeToggle />
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          <EnvironmentProvider>
            {children}
          </EnvironmentProvider>
        </main>
      </div>
    </div>
  )
}
