"use client"

import { Globe } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Environment {
  name: string
  isDefault: boolean
}

interface DemoEnvironmentSwitcherProps {
  selectedEnvironment: string | null
  onEnvironmentChange: (env: string | null) => void
  environments: Environment[]
  className?: string
}

export function DemoEnvironmentSwitcher({ 
  selectedEnvironment, 
  onEnvironmentChange, 
  environments,
  className 
}: DemoEnvironmentSwitcherProps) {
  return (
    <Select 
      value={selectedEnvironment ?? "all"} 
      onValueChange={(v) => onEnvironmentChange(v === "all" ? null : v)}
    >
      <SelectTrigger className={cn("w-[180px]", className)}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="All environments" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All environments</SelectItem>
        {environments.map((env) => (
          <SelectItem key={env.name} value={env.name}>
            {env.name}
            {env.isDefault && " (default)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
