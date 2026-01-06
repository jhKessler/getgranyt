"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github, BookOpen, Menu } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { GITHUB_URL } from "@/lib/constants"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"

function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">G</span>
          </div>
          <span className="text-xl font-bold">Granyt</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/docs" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <Link 
            href={GITHUB_URL} 
            target="_blank"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ModeToggle />
          <Button asChild variant="ghost" size="icon" className="hidden sm:flex">
            <Link href={GITHUB_URL} target="_blank">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/docs">
              <BookOpen className="h-4 w-4 mr-2" />
              Docs
            </Link>
          </Button>
          
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <nav className="flex flex-col gap-4 mt-8">
                <SheetClose asChild>
                  <Link 
                    href="/docs" 
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors py-2"
                  >
                    <BookOpen className="h-5 w-5" />
                    Documentation
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link 
                    href={GITHUB_URL} 
                    target="_blank"
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors py-2"
                  >
                    <Github className="h-5 w-5" />
                    GitHub
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function MarketingFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
          <div className="space-y-4 col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">G</span>
              </div>
              <span className="text-xl font-bold">Granyt</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Open-source data observability for Apache Airflow.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
              <li><Link href="/docs/data-metrics" className="hover:text-foreground transition-colors">Data Metrics</Link></li>
              <li><Link href="/docs/error-tracking" className="hover:text-foreground transition-colors">Error Tracking</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={GITHUB_URL} target="_blank" className="hover:text-foreground transition-colors">GitHub</Link></li>
              <li><Link href={`${GITHUB_URL}/issues`} target="_blank" className="hover:text-foreground transition-colors">Report Issues</Link></li>
              <li><Link href={`${GITHUB_URL}/discussions`} target="_blank" className="hover:text-foreground transition-colors">Discussions</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Granyt. Open source under Apache 2.0 License.
          </p>
          <div className="flex items-center gap-4">
            <Link 
              href={GITHUB_URL} 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
