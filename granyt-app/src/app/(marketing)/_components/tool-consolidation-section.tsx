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
  Layers,
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
    icon: AlertTriangle,
    name: "Errors With Context",
    description: "Stack traces that show dag_id, task_id, and run_id. Not just 'Exception in worker'.",
    highlights: ["DAG-aware grouping", "Operator metrics", "One-click to logs"],
  },
  {
    icon: Bell,
    name: "Alerts That Matter",
    description: "Know when row counts drop 90% or schemas change. Not just 'task failed'.",
    highlights: ["Row count anomalies", "Schema drift detection", "Slack & email"],
  },
  {
    icon: Layers,
    name: "Multi-Environment",
    description: "Compare errors across dev, staging, and prod without grep-ing through logs.",
    highlights: ["Environment filtering", "Cross-env comparison", "Unified view"],
  },
  {
    icon: Shield,
    name: "Self-Hosted",
    description: "Your data never leaves your infrastructure. No $2k/month bill.",
    highlights: ["MIT licensed", "Docker or K8s", "No vendor lock-in"],
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
          {tool.capabilities.map((capability) => (
            <div key={capability} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">{capability}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {tool.limitations.map((limitation) => (
            <div key={limitation} className="flex items-center gap-2 text-xs">
              <X className="h-3 w-3 text-red-400" />
              <span className="text-muted-foreground">{limitation}</span>
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
        relative p-4 sm:p-5 rounded-2xl border-2 border-primary/50 bg-gradient-to-b from-primary/10 to-primary/5
        transition-all duration-700
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
      `}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div>
          <span className="font-bold text-lg sm:text-xl">Granyt</span>
          <p className="text-xs sm:text-sm text-muted-foreground">All-in-one Airflow observability</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {granytCapabilities.map((capability, i) => {
          const Icon = capability.icon
          return (
            <div 
              key={capability.name}
              className={`
                p-3 rounded-lg bg-background/50 border border-border/50
                transition-all duration-500 hover:border-primary/30
                ${showCapabilities ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-sm">{capability.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{capability.description}</p>
              <ul className="space-y-1">
                {capability.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                    <span className="line-clamp-1">{highlight}</span>
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
            `}
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
          <Badge variant="secondary">Unified Observability</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Your current setup is held together with duct tape
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sentry doesn&apos;t know what a DAG is. Grafana requires a PhD to configure. The Airflow UI shows you logs, not insights. Granyt replaces the duct tape with something that actually works.
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
