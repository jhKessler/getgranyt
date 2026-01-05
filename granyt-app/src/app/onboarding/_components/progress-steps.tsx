"use client"

import { cn } from "@/lib/utils"
import { Building2, Key, Check, Mail } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Step {
  id: number
  name: string
  icon: LucideIcon
}

const STEPS: Step[] = [
  { id: 1, name: "Organization", icon: Building2 },
  { id: 2, name: "Email", icon: Mail },
  { id: 3, name: "API Key", icon: Key },
]

interface ProgressStepsProps {
  currentStep: number
}

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((step, index) => (
        <StepIndicator 
          key={step.id} 
          step={step} 
          currentStep={currentStep}
          isLast={index === STEPS.length - 1}
        />
      ))}
    </div>
  )
}

function StepIndicator({ 
  step, 
  currentStep, 
  isLast 
}: { 
  step: Step
  currentStep: number
  isLast: boolean 
}) {
  const isComplete = currentStep > step.id
  const isActive = currentStep >= step.id
  const StepIcon = step.icon

  return (
    <div className="flex items-center">
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
        isActive
          ? "bg-primary border-primary text-primary-foreground"
          : "border-muted-foreground/30 text-muted-foreground"
      )}>
        {isComplete ? (
          <Check className="h-5 w-5" />
        ) : (
          <StepIcon className="h-5 w-5" />
        )}
      </div>
      {!isLast && (
        <div className={cn(
          "w-16 h-0.5 mx-2",
          isComplete ? "bg-primary" : "bg-muted-foreground/30"
        )} />
      )}
    </div>
  )
}

export { STEPS }
