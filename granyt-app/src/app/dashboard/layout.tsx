"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { cn, getDocsLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileSidebar, type NavItem } from "@/components/shared"
import { Shield, LayoutDashboard, LogOut, Plug, AlertTriangle, GitBranch, Play, Bell, Settings } from "lucide-react"
import { toast } from "sonner"
import { EnvironmentProvider } from "@/lib/environment-context"
import { motion } from "framer-motion"

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "DAGs", href: "/dashboard/dags", icon: GitBranch },
  { name: "Runs", href: "/dashboard/runs", icon: Play },
  { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { name: "Errors", href: "/dashboard/errors", icon: AlertTriangle },
  { name: "API Keys", href: "/dashboard/apikeys", icon: Plug },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Docs", href: getDocsLink("", "dashboard-nav"), icon: Shield },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login")
    }
  }, [session, isPending, router])

  if (isPending || !session) {
    return null
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    toast.success("Signed out successfully")
    router.push("/login")
    router.refresh()
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <EnvironmentProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar - hidden on mobile */}
        <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-card hidden md:block">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={session ? "/dashboard" : "/"} className="flex h-16 items-center gap-2 px-6 border-b">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Granyt</span>
              </Link>
            </motion.div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item, index) => {
                const isExternal = item.href.startsWith("http")
                const isActive = isExternal 
                  ? false 
                  : item.href === "/dashboard" 
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href)
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  >
                    <Link
                      href={item.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            {/* User section */}
            <motion.div 
              className="border-t p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 px-3 hover:bg-accent transition-all duration-200">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session?.user?.image || undefined} />
                        <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{session?.user?.name || "User"}</span>
                      <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>
        </aside>

        {/* Main content */}
        <div className="md:pl-64">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            {/* Mobile: hamburger + logo */}
            <div className="flex items-center gap-3 md:hidden">
              <MobileSidebar 
                navigation={navigation} 
                basePath="/dashboard"
                footer={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start gap-3 px-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session?.user?.image || undefined} />
                          <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-sm">
                          <span className="font-medium">{session?.user?.name || "User"}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{session?.user?.email}</span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />
              <Link href="/dashboard" className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-bold">Granyt</span>
              </Link>
            </div>
            {/* Desktop: empty space on left, toggle on right */}
            <div className="hidden md:block" />
            <ModeToggle />
          </header>

          {/* Page content */}
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </EnvironmentProvider>
  )
}
