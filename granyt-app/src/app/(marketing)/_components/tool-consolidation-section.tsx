"use client"

import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { 
  Bug, 
  BarChart3, 
  GitBranch, 
  Bell, 
  Zap,
  ArrowDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Shield,
  type LucideIcon
} from "lucide-react"

interface Tool {
  name: string
  icon: React.ReactNode
  color: string
  capabilities: string[]
  limitations: string[]
}

const externalTools: Tool[] = [
  {
    name: "Sentry",
    icon: <Bug className="h-5 w-5" />,
    color: "from-purple-500/20 to-purple-500/5",
    capabilities: ["Error tracking", "Stack traces"],
    limitations: ["No DAG context", "Not data-aware"],
  },
  {
    name: "Grafana",
    icon: <BarChart3 className="h-5 w-5" />,
    color: "from-orange-500/20 to-orange-500/5",
    capabilities: ["Metrics viz", "Dashboards"],
    limitations: ["Complex setup", "No error linking"],
  },
  {
    name: "Airflow UI",
    icon: <GitBranch className="h-5 w-5" />,
    color: "from-cyan-500/20 to-cyan-500/5",
    capabilities: ["DAG status", "Task logs"],
    limitations: ["No metrics", "Basic alerts"],
  },
]

interface GranytCapability {
  icon: LucideIcon
  name: string
  description: string
  highlights: string[]
}

const granytCapabilities: GranytCapability[] = [
  {
    icon: Zap,
    name: "Automatic DAG Monitoring",
    description: "Zero-code instrumentation that captures every DAG and task run automatically.",
    highlights: ["DAG run events", "Task-level timing", "Run type detection"],
  },
  {
    icon: AlertTriangle,
    name: "Rich Error Capture",
    description: "Sentry-like error tracking designed specifically for Airflow DAGs.",
    highlights: ["Full stack traces", "Auto error grouping", "Task metadata context"],
  },
  {
    icon: BarChart3,
    name: "Data Metrics Capture",
    description: "Track DataFrame statistics and custom metrics at any point in your DAG.",
    highlights: ["Row counts & schema", "Null detection", "Custom KPIs"],
  },
  {
    icon: GitBranch,
    name: "Data Lineage",
    description: "Understand how data flows through your DAGs with OpenLineage support.",
    highlights: ["OpenLineage events", "Upstream tracking", "Dataset visualization"],
  },
  {
    icon: Shield,
    name: "Privacy-First Design",
    description: "Your data stays on your infrastructure. No external dependencies required.",
    highlights: ["Self-hosted", "Auto data redaction", "No data leaves"],
  },
  {
    icon: Bell,
    name: "Uncover Silent Issues",
    description: "Get notified when your data changes unexpectedly - before it breaks downstream.",
    highlights: ["Schema change alerts", "Anomaly detection", "Slack & email notifications"],
  },
]

function ToolCard({ tool, isAnimating }: { tool: Tool; isAnimating: boolean }) {
  return (
    <div 
      className={`
        relative p-4 rounded-xl border border-border/50 bg-gradient-to-b ${tool.color}
        transition-all duration-700
        ${isAnimating ? 'opacity-50 scale-95 translate-y-4' : 'opacity-100 scale-100'}
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-background/50 flex items-center justify-center">
          {tool.icon}
        </div>
        <span className="font-semibold">{tool.name}</span>
      </div>
      
      <div className="space-y-2">
        <div className="space-y-1">
          {tool.capabilities.map((cap) => (
            <div key={cap} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">{cap}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {tool.limitations.map((lim) => (
            <div key={lim} className="flex items-center gap-2 text-xs">
              <X className="h-3 w-3 text-red-400" />
              <span className="text-muted-foreground">{lim}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connection line indicator */}
      <div className={`
        absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-0.5 bg-gradient-to-b from-border to-transparent
        transition-opacity duration-500
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
      `} />
    </div>
  )
}

function GranytConsolidatedCard({ isVisible }: { isVisible: boolean }) {
  const [showCapabilities, setShowCapabilities] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowCapabilities(true), 400)
      return () => clearTimeout(timer)
    }
    setShowCapabilities(false)
  }, [isVisible])

  return (
    <div 
      className={`
        relative p-6 rounded-2xl border-2 border-primary/50 bg-gradient-to-b from-primary/10 to-primary/5
        transition-all duration-700
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
      `}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <span className="font-bold text-xl">Granyt</span>
          <p className="text-sm text-muted-foreground">All-in-one Airflow observability</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {granytCapabilities.map((cap, i) => {
          const Icon = cap.icon
          return (
            <div 
              key={cap.name}
              className={`
                p-4 rounded-lg bg-background/50 border border-border/50
                transition-all duration-500 hover:border-primary/30
                ${showCapabilities ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{cap.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{cap.description}</p>
              <ul className="space-y-1">
                {cap.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-primary/60" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Badge */}
      <div className="absolute -top-3 right-4">
        <Badge className="bg-primary text-primary-foreground">5 min setup</Badge>
      </div>
    </div>
  )
}

function FlowingArrows({ isAnimating }: { isAnimating: boolean }) {
  return (
    <div className={`
      flex justify-center py-6
      transition-opacity duration-500
      ${isAnimating ? 'opacity-100' : 'opacity-30'}
    `}>
      <div className="flex items-center gap-8">
        {[0, 1, 2].map((i) => (
          <ArrowDown 
            key={i} 
            className={`
              h-6 w-6 text-primary
              ${isAnimating ? 'animate-bounce' : ''}
            `}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export function ToolConsolidationSection() {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showGranyt, setShowGranyt] = useState(true)

  // Auto-animate on scroll into view
  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById('tool-consolidation')
      if (section) {
        const rect = section.getBoundingClientRect()
        const isInView = rect.top < window.innerHeight * 0.7 && rect.bottom > 0
        if (isInView && !isAnimating) {
          triggerAnimation()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    // Check on mount
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isAnimating])

  const triggerAnimation = () => {
    setIsAnimating(true)
    setShowGranyt(true)
    
    // Reset after animation completes
    setTimeout(() => {
      setIsAnimating(false)
    }, 2000)
  }

  return (
    <section id="tool-consolidation" className="py-24 bg-muted/30">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary">One Tool to Rule Them All</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            The best of all worlds
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ever set up monitoring only to never really use it?... I did too. Granyt consolidates error tracking, metrics, lineage, and alerts into a single, easy-to-use platform built specifically for Airflow.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {externalTools.map((tool) => (
            <ToolCard key={tool.name} tool={tool} isAnimating={isAnimating} />
          ))}
        </div>

        {/* Flowing arrows */}
        <FlowingArrows isAnimating={isAnimating} />

        {/* Granyt consolidated */}
        <div className="max-w-5xl mx-auto">
          <GranytConsolidatedCard isVisible={showGranyt} />
        </div>


      </div>
    </section>
  )
}
