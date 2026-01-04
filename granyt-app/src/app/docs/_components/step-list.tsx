interface Step {
  title: string
  content: React.ReactNode
}

interface StepListProps {
  steps: Step[]
}

export function StepList({ steps }: StepListProps) {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div key={step.title} className="flex gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
            {index + 1}
          </div>
          <div className="space-y-3 flex-1">
            <h3 className="font-semibold">{step.title}</h3>
            {typeof step.content === "string" ? (
              <p className="text-sm text-muted-foreground">{step.content}</p>
            ) : (
              step.content
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

interface StepCardProps {
  number: number
  title: string
  description: string
}

export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
        {number}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
