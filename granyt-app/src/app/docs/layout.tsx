"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { 
  Shield, 
  Book, 
  ChevronDown, 
  Home,
  BarChart3,
  Settings,
  LayoutDashboard,
  AlertTriangle,
  Webhook,
  Mail,
  Zap,
  Layers,
  ExternalLink,
  Github,
  Menu,
} from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  title: string
  items: NavItem[]
}

const docsSections: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Quickstart", href: "/docs", icon: Home },
    ],
  },
  {
    title: "SDK Reference",
    items: [
      { title: "Metrics & Operators", href: "/docs/metrics", icon: BarChart3 },
      { title: "Environment Variables", href: "/docs/sdk-reference/environment-variables", icon: Settings },
    ],
  },
  {
    title: "Dashboard",
    items: [
      { title: "Live Demo", href: "/demo", icon: LayoutDashboard },
      { title: "Error Tracking", href: "/docs/error-tracking", icon: AlertTriangle },
      { title: "Notifications", href: "/docs/notifications", icon: Mail },
      { title: "Webhooks", href: "/docs/webhooks", icon: Webhook },
    ],
  },
]

function NavSection({ section, isOpen, onToggle, onLinkClick }: { 
  section: NavSection
  isOpen: boolean
  onToggle: () => void
  onLinkClick?: () => void
}) {
  const pathname = usePathname()
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <motion.div
          whileHover={{ x: 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Button 
            variant="ghost" 
            className="w-full justify-between px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            {section.title}
            <motion.div
              animate={{ rotate: isOpen ? 0 : 90 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </motion.div>
      </CollapsibleTrigger>
      <AnimatePresence initial={false}>
        {isOpen && (
          <CollapsibleContent className="space-y-1 px-2">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {section.items.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.2,
                      delay: index * 0.03,
                      ease: "easeOut"
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={onLinkClick}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium shadow-md"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
                      )}
                    >
                      <motion.div
                        whileHover={{ scale: 1.08, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <item.icon className="h-4 w-4" />
                      </motion.div>
                      {item.title}
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  )
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Getting Started": true,
    "SDK Reference": true,
    "Dashboard": true,
  })

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <motion.div 
        className="flex h-16 items-center gap-2 px-6 border-b"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <Shield className="h-6 w-6 text-primary" />
        </motion.div>
        <span className="text-xl font-bold">Granyt</span>
        <span className="text-xs text-muted-foreground ml-1">Docs</span>
      </motion.div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-2 px-2">
          {docsSections.map((section) => (
            <NavSection
              key={section.title}
              section={section}
              isOpen={openSections[section.title] ?? true}
              onToggle={() => toggleSection(section.title)}
              onLinkClick={onLinkClick}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer links */}
      <motion.div 
        className="border-t p-4 space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <motion.div
          whileHover={{ x: 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Link
            href="https://github.com/granyt/granyt"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onLinkClick}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 px-3 py-2"
          >
            <Github className="h-4 w-4" />
            GitHub
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Link>
        </motion.div>

      </motion.div>
    </div>
  )
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-card hidden lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onLinkClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
            <Book className="h-5 w-5 text-muted-foreground hidden sm:block" />
            <span className="text-sm text-muted-foreground hidden sm:block">Documentation</span>
            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Docs</span>
            </div>
          </div>
          <ModeToggle />
        </header>

        {/* Page content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">{children}</main>
      </div>
    </div>
  )
}
