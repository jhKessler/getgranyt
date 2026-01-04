"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  Play, 
  BarChart3, 
  Bell, 
  AlertTriangle,
  Activity,
  TrendingDown,
} from "lucide-react"

// Mini preview cards showing dashboard UI
function MiniMetricCard({ 
  title, 
  value, 
  icon: Icon,
  variant = "default" 
}: { 
  title: string
  value: string | number
  icon: React.ElementType
  variant?: "default" | "destructive"
}) {
  return (
    <div className="bg-card border rounded-lg p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{title}</span>
        <Icon className={`h-3.5 w-3.5 ${variant === "destructive" ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      <p className={`text-lg font-bold ${variant === "destructive" ? "text-destructive" : ""}`}>{value}</p>
    </div>
  )
}

function MiniAlertItem({ type, dag, severity }: { type: string; dag: string; severity: "critical" | "warning" }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded border bg-card/50 text-xs">
      <TrendingDown className={`h-3.5 w-3.5 ${severity === "critical" ? "text-red-500" : "text-orange-500"}`} />
      <span className="truncate flex-1">{dag}</span>
      <Badge 
        variant={severity === "critical" ? "destructive" : "secondary"} 
        className="text-[10px] px-1 py-0"
      >
        {type}
      </Badge>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="relative bg-background border rounded-xl shadow-2xl overflow-hidden">
      {/* Fake browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-muted rounded-md px-4 py-1 text-xs text-muted-foreground">
            app.granyt.dev/dashboard
          </div>
        </div>
      </div>

      {/* Dashboard content preview */}
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Dashboard</h3>
            <p className="text-xs text-muted-foreground">Overview of your DAGs</p>
          </div>
          <Badge variant="outline" className="text-xs">Last 7 days</Badge>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MiniMetricCard title="Total Runs" value="1,847" icon={BarChart3} />
          <MiniMetricCard title="Unique DAGs" value="24" icon={Activity} />
          <MiniMetricCard title="Failed Runs" value="12" icon={AlertTriangle} variant="destructive" />
          <MiniMetricCard title="Rows Processed" value="2.4M" icon={BarChart3} />
        </div>

        {/* Chart placeholder */}
        <div className="bg-card border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">DAG Runs (Last 7 Days)</span>
          </div>
          <div className="flex items-end gap-1 h-16">
            {[40, 65, 45, 80, 55, 70, 60].map((height, i) => (
              <div 
                key={i} 
                className="flex-1 bg-primary/80 rounded-t" 
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day} className="text-[10px] text-muted-foreground">{day}</span>
            ))}
          </div>
        </div>

        {/* Notifications preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-card border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Notifications</span>
              <Badge className="bg-red-500/10 text-red-500 text-[10px] px-1 py-0 ml-auto">3</Badge>
            </div>
            <MiniAlertItem type="Row Drop" dag="etl_daily_sales" severity="critical" />
            <MiniAlertItem type="Schema" dag="sync_customer_data" severity="warning" />
          </div>
          <div className="bg-card border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Recent Errors</span>
              <Badge className="bg-destructive/10 text-destructive text-[10px] px-1 py-0 ml-auto">4</Badge>
            </div>
            <div className="text-xs text-muted-foreground p-2 border rounded bg-card/50">
              <span className="font-mono text-destructive">ConnectionError</span>
              <p className="truncate mt-0.5 text-[10px]">Failed to connect to PostgreSQL...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient overlay for effect */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
    </div>
  )
}

export function DemoPreviewSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Interactive Demo</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Experience the Dashboard
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No signup. No install. <br />
            See exactly what you&apos;ll get with realistic sample data.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <DashboardPreview />
        </div>

        <div className="flex justify-center mt-8">
          <Button asChild size="lg" className="gap-2">
            <Link href="/demo">
              <Play className="h-4 w-4" />
              Explore Full Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
