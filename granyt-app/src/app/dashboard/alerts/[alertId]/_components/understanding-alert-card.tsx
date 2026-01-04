"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  TrendingDown, 
  HelpCircle, 
  Lightbulb, 
  Settings2,
  CheckCircle 
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { AlertMetadata } from "./types"

// =============================================================================
// ALERT EXPLANATION CONFIG - Add new alert types here! 🎯
// =============================================================================

interface AlertExplanationConfig {
  /** Renders the dynamic explanation based on metadata */
  renderExplanation: (metadata?: AlertMetadata) => React.ReactNode
  /** Why this alert matters - shown in the info box */
  whyItMatters: string
}

/**
 * Configuration for all alert type explanations.
 * To add a new alert type:
 * 1. Add metadata types in types.ts
 * 2. Add a new entry here with renderExplanation and whyItMatters
 * That's it! The UI will automatically pick it up 🚀
 */
const ALERT_EXPLANATIONS: Record<string, AlertExplanationConfig> = {
  ROW_COUNT_DROP: {
    renderExplanation: (metadata) => {
      const baselineDescription = metadata?.baselineType === "cohort" 
        ? "runs with the same trigger type on the same weekday" 
        : "the overall historical average"
      const confidenceLabel = metadata?.confidence === "high" 
        ? "high confidence" 
        : metadata?.confidence === "medium" 
          ? "medium confidence" 
          : "low confidence"
      
      return (
        <>
          <p>
            This pipeline run produced <strong className="text-foreground">{metadata?.current?.toLocaleString() ?? 0} rows</strong>, 
            which is <strong className="text-red-500">{Math.round(metadata?.dropPercentage ?? 0)}% fewer</strong> than 
            the expected baseline of <strong className="text-foreground">{metadata?.baseline?.toLocaleString() ?? "?"} rows</strong>.
          </p>
          <p>
            This baseline was calculated from {baselineDescription}
            {metadata?.runsAnalyzed && (
              <>, analyzing the last <strong className="text-foreground">{metadata.runsAnalyzed}</strong> successful runs</>
            )}.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-2 italic">
            🧠 This detection uses context-aware analysis that compares against similar runs (e.g., same day of week, 
            same trigger type) to reduce false positives. Detection accuracy improves as more historical data is 
            gathered - currently at <strong>{confidenceLabel}</strong>
            {metadata?.runsAnalyzed && metadata.runsAnalyzed < 14 && (
              <> (needs ~{14 - metadata.runsAnalyzed} more runs for full confidence)</>
            )}.
          </p>
        </>
      )
    },
    whyItMatters: 
      "A significant drop in row count often indicates a data quality issue - the upstream source " +
      "may have had missing data, a filter may have removed too many records, or there could be " +
      "a bug in your pipeline logic.",
  },

  NULL_OCCURRENCE: {
    renderExplanation: (metadata) => {
      const columnCount = metadata?.columnCount ?? metadata?.affectedColumns?.length ?? 0
      const columnNames = metadata?.affectedColumns?.map(c => c.name) ?? []
      const runsAnalyzed = metadata?.historicalOccurrencesAnalyzed ?? "several"
      
      return (
        <>
          <p>
            <strong className="text-amber-500">{columnCount} column{columnCount !== 1 ? "s" : ""}</strong> that 
            usually {columnCount === 1 ? "doesn't" : "don't"} contain any null values now {columnCount === 1 ? "has" : "have"} null values 
            (based on the last <strong className="text-foreground">{runsAnalyzed} runs</strong>):
          </p>
          {columnNames.length > 0 && (
            <ul className="list-disc list-inside space-y-1 mt-2">
              {columnNames.map((name) => (
                <li key={name} className="font-mono text-foreground">{name}</li>
              ))}
            </ul>
          )}
        </>
      )
    },
    whyItMatters:
      "Unexpected null values often indicate data quality issues upstream - a source system may have " +
      "changed its behavior, an API might be returning incomplete data, or a transformation step " +
      "could be failing silently. This can lead to incorrect calculations, broken joins, or missing data in reports.",
  },

  SCHEMA_CHANGE: {
    renderExplanation: (metadata) => {
      const addedColumns = metadata?.addedColumns ?? []
      const removedColumns = metadata?.removedColumns ?? []
      const typeChangedColumns = metadata?.typeChangedColumns ?? []
      
      return (
        <>
          <p>The schema of this data changed compared to previous runs:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            {removedColumns.map((col) => (
              <li key={`removed-${col.name}`}>
                Column <strong className="font-mono text-red-500">{col.name}</strong> disappeared
              </li>
            ))}
            {addedColumns.map((col) => (
              <li key={`added-${col.name}`}>
                New column <strong className="font-mono text-green-500">{col.name}</strong> was added
              </li>
            ))}
            {typeChangedColumns.map((col) => (
              <li key={`changed-${col.name}`}>
                Column <strong className="font-mono text-amber-500">{col.name}</strong> changed datatype from{" "}
                <span className="text-muted-foreground">{col.previousType}</span> to{" "}
                <span className="text-foreground">{col.currentType}</span>
              </li>
            ))}
          </ul>
        </>
      )
    },
    whyItMatters:
      "Schema changes can break downstream pipelines, dashboards, and reports. Removed columns may " +
      "cause queries to fail, added columns might indicate new data that needs to be processed, and " +
      "type changes can lead to data corruption or incorrect calculations. It's important to verify " +
      "if these changes are intentional and update dependent systems accordingly.",
  },
}

// =============================================================================
// Components
// =============================================================================

interface UnderstandingAlertCardProps {
  alertType: string
  metadata?: AlertMetadata
}

export function UnderstandingAlertCard({ alertType, metadata }: UnderstandingAlertCardProps) {
  const hasExplanation = alertType in ALERT_EXPLANATIONS

  if (!hasExplanation) {
    return null // Don't render the card if we don't have an explanation for this alert type
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <CardTitle>What triggered this alert?</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full" defaultValue={["what-happened"]}>
          <WhatHappenedSection alertType={alertType} metadata={metadata} />
        </Accordion>
      </CardContent>
    </Card>
  )
}

interface SectionProps {
  alertType?: string
  metadata?: AlertMetadata
  router?: ReturnType<typeof useRouter>
}

function WhatHappenedSection({ alertType, metadata }: SectionProps) {
  if (!alertType || !(alertType in ALERT_EXPLANATIONS)) return null
  
  const config = ALERT_EXPLANATIONS[alertType]

  return (
    <AccordionItem value="what-happened">
      <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2">
        {config.renderExplanation(metadata)}
        <div className="bg-muted/50 rounded-lg p-3 mt-2">
          <p className="font-medium text-foreground mb-1">Why this matters:</p>
          <p>{config.whyItMatters}</p>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function _SensitivityLevelsSection({ metadata, router }: SectionProps) {
  return (
    <AccordionItem value="sensitivity">
      <AccordionTrigger className="text-base">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          What do sensitivity levels mean?
        </div>
      </AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2">
        <p>
          Sensitivity controls how large a drop must be before an alert is triggered. 
          This alert was triggered at <strong className="text-foreground">{metadata?.threshold ?? "MEDIUM"}</strong> sensitivity
          {metadata?.customThreshold && <> with a <strong className="text-foreground">{metadata.customThreshold}%</strong> threshold</>}.
        </p>
        <div className="space-y-2 mt-3">
          <SensitivityLevelItem 
            color="bg-foreground"
            level="HIGH"
            currentLevel={metadata?.threshold}
            label="High Sensitivity (90%+ drop)"
            description="Alerts trigger when row count drops by 90% or more. Best for critical pipelines where even moderate drops should be investigated."
          />
          <SensitivityLevelItem 
            color="bg-foreground/70"
            level="MEDIUM"
            currentLevel={metadata?.threshold}
            label="Medium Sensitivity (95%+ drop) - Default"
            description="Alerts trigger when row count drops by 95% or more. Good balance between catching issues and avoiding noise."
          />
          <SensitivityLevelItem 
            color="bg-foreground/40"
            level="LOW"
            currentLevel={metadata?.threshold}
            label="Low Sensitivity (99%+ drop)"
            description="Alerts only trigger when row count drops by 99% or more (nearly empty). Use for pipelines with naturally variable output."
          />
          <SensitivityLevelItem 
            color="bg-foreground/20"
            level="CUSTOM"
            currentLevel={metadata?.threshold}
            label="Custom Threshold"
            description="Set your own percentage threshold (1-99%). Useful when the preset options don't fit your needs."
          />
        </div>
        <p className="text-xs mt-2">
          You can adjust sensitivity in the <Button variant="link" className="h-auto p-0 text-xs" onClick={() => router?.push("/dashboard/alerts")}>Alerts settings</Button>.
        </p>
      </AccordionContent>
    </AccordionItem>
  )
}

interface SensitivityLevelItemProps {
  color: string
  level: string
  currentLevel?: string
  label: string
  description: string
}

function SensitivityLevelItem({ color, level, currentLevel, label, description }: SensitivityLevelItemProps) {
  const isActive = currentLevel === level

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      isActive ? "bg-muted border-foreground/20" : "border-transparent"
    )}>
      <span className={cn("h-2 w-2 rounded-full mt-1.5 flex-shrink-0", color)} />
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs">{description}</p>
      </div>
    </div>
  )
}

function _ActionsSection() {
  return (
    <AccordionItem value="actions">
      <AccordionTrigger className="text-base">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          Which action should I take?
        </div>
      </AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground space-y-4 pt-2">
        <ActionExplanation
          icon={<Settings2 className="h-4 w-4" />}
          title="This is Expected Behavior"
          bgColor="bg-muted"
          useWhen="This drop is normal for this pipeline"
          features={[
            "Opens a dialog to adjust the sensitivity level for this pipeline",
            "You can choose HIGH, MEDIUM, LOW, CUSTOM, or DISABLED",
            "The alert is automatically dismissed after saving",
            "Future runs will use the new sensitivity level",
          ]}
          example="A pipeline that naturally has variable output - you want to only alert on severe (99%+) drops."
          exampleBgColor="bg-muted/50"
        />

        <ActionExplanation
          icon={<CheckCircle className="h-4 w-4" />}
          title="Acknowledge & Resolve"
          bgColor="bg-muted"
          useWhen="You've reviewed this alert and it's handled"
          features={[
            "Marks the alert as reviewed and resolved",
            "Does NOT change any sensitivity settings",
            "Future runs will still be monitored with the same sensitivity",
          ]}
          example="Known maintenance window caused missing data, you've already fixed the upstream issue, or this was a false positive."
          exampleBgColor="bg-muted/50"
        />
      </AccordionContent>
    </AccordionItem>
  )
}

interface ActionExplanationProps {
  icon: React.ReactNode
  title: string
  bgColor: string
  useWhen: string
  features: string[]
  example: string
  exampleBgColor: string
}

function ActionExplanation({ 
  icon, 
  title, 
  bgColor, 
  useWhen, 
  features, 
  example, 
  exampleBgColor 
}: ActionExplanationProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className={cn("px-4 py-2 border-b flex items-center gap-2", bgColor)}>
        {icon}
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <div className="p-4 space-y-2">
        <p className="font-medium text-foreground">Use when: {useWhen}</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
        <div className={cn("rounded p-2 mt-2 text-xs", exampleBgColor)}>
          <strong>Example{features.length > 1 ? "s" : ""}:</strong> {example}
        </div>
      </div>
    </div>
  )
}
