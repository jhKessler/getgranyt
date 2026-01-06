"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Github, Sparkles, BookOpen, Copy, Check } from "lucide-react"
import { INSTALL_COMMAND, GITHUB_URL } from "@/lib/constants"
import { getDocsLink } from "@/lib/utils"

function InstallCommand() {
  const command = INSTALL_COMMAND
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 bg-zinc-950 border border-border/50 rounded-lg px-3 sm:px-4 py-3 font-mono text-sm max-w-full overflow-x-auto">
      <code className="text-green-400 whitespace-nowrap text-xs sm:text-sm">{command}</code>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

function HeroHeadline() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
        Pipeline monitoring{" "}
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          you&apos;ll actually use
        </span>
      </h1>
      <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
        Granyt is a modern, open source all-in-one monitoring platform for Apache Airflow that lets you catch errors and data issues before they reach production.
      </p>
    </>
  )
}

export function HeroSection() {

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>


      <div className="container mx-auto max-w-6xl px-4 py-24 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Badge */}
          <Link
            href={GITHUB_URL}
            target="_blank"
            className="group"
          >
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm hover:bg-secondary/80 transition-colors cursor-pointer">
              <Sparkles className="h-4 w-4" />
              <span>100% Open Source</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Badge>
          </Link>

          {/* Main heading */}
          <div className="space-y-4 max-w-4xl px-2">
            <HeroHeadline />
          </div>

          {/* Secondary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="gap-2 text-base">
              <Link href={getDocsLink("/")}>
                <BookOpen className="h-4 w-4" />
                Docs
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 text-base">
              <Link
                href={GITHUB_URL}
                target="_blank"
              >
                <Github className="h-4 w-4" />
                Star on GitHub
              </Link>
            </Button>
          </div>

          {/* Quick value props */}
          <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>100% Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Self-Hosted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>5-minute install</span>
            </div>
          </div>

          {/* Built for Airflow */}
          <div className="flex items-center gap-3 pt-4">
            <span className="text-xs text-muted-foreground/60">Built for</span>
            <Image
              src="/airflow_transparent.png"
              alt="Apache Airflow"
              width={28}
              height={28}
              className="opacity-60 hover:opacity-100 transition-opacity"
            />
            <span className="text-sm text-muted-foreground/80">Apache Airflow</span>
          </div>
        </div>
      </div>
    </section>
  )
}
