import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Github, BookOpen, MessageSquare } from "lucide-react"
import { GITHUB_URL } from "@/lib/constants"
import { getDocsLink } from "@/lib/utils"

export function CTASection() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
          </div>

          <CardContent className="py-16 px-8 md:px-16">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <Badge variant="secondary" className="mb-2">
                Open Source
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Your DAG failed 3 hours ago. Your dashboard didn&apos;t notice.
              </h2>
              <p className="text-xl text-muted-foreground">
                Granyt would have. Deploy in 5 minutes, catch the next failure before anyone notices.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="gap-2 text-base">
                  <Link 
                    href={getDocsLink("/")}
                  >
                    <BookOpen className="h-4 w-4" />
                    Docs
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional links */}
        <div className="grid gap-6 md:grid-cols-3 mt-12">
          <Link 
            href={GITHUB_URL} 
            target="_blank"
            className="group"
          >
            <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <Github className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Star on GitHub
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View source code and contribute
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link 
            href={getDocsLink("/")} 
            className="group"
          >
            <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Documentation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Learn how to get the most out of Granyt
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link 
            href={`${GITHUB_URL}/discussions`} 
            target="_blank"
            className="group"
          >
            <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Community
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Join discussions and get help
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </section>
  )
}
