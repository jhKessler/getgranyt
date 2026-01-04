"use client"

import { Check, ChevronDown, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useEnvironment } from "@/lib/environment-context"

interface LocalEnvironmentSwitcherProps {
  className?: string
  showAllOption?: boolean
  selectedEnvironment: string | null
  onEnvironmentChange: (env: string | null) => void
}

export function LocalEnvironmentSwitcher({ 
  className, 
  showAllOption = true,
  selectedEnvironment,
  onEnvironmentChange,
}: LocalEnvironmentSwitcherProps) {
  const [open, setOpen] = useState(false)
  const { environments, isLoading } = useEnvironment()

  if (isLoading) {
    return (
      <Button variant="outline" className={cn("w-[180px] justify-between", className)} disabled>
        <span className="text-muted-foreground">Loading...</span>
      </Button>
    )
  }

  if (environments.length === 0) {
    return null
  }

  const _selectedEnvData = environments.find((e) => e.name === selectedEnvironment)
  const displayValue = selectedEnvironment ?? "All Environments"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[180px] px-3 justify-between", className)}
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate capitalize">{displayValue}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No environment found.</CommandEmpty>
            <CommandGroup>
              {showAllOption && (
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onEnvironmentChange(null)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedEnvironment === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Environments
                </CommandItem>
              )}
              {environments.map((env) => (
                <CommandItem
                  key={env.name}
                  value={env.name}
                  onSelect={() => {
                    onEnvironmentChange(env.name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedEnvironment === env.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="capitalize flex-1">{env.name}</span>
                  {env.isDefault && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 ml-2">
                      default
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
