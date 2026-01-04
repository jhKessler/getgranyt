"use client"

import { DataCard, EmptyState } from "@/components/shared"
import { CheckCircle, LucideIcon } from "lucide-react"
import { ReactNode } from "react"

// =============================================================================
// Types
// =============================================================================

interface IssuesCardProps<T> {
  title: string
  description?: string
  items: T[]
  isLoading: boolean
  emptyMessage: string
  activeIcon: LucideIcon
  activeIconClass: string
  renderItem: (item: T) => ReactNode
  getItemKey: (item: T) => string
}

// =============================================================================
// Component
// =============================================================================

export function IssuesCard<T>({
  title,
  description,
  items,
  isLoading,
  emptyMessage,
  activeIcon: ActiveIcon,
  activeIconClass,
  renderItem,
  getItemKey,
}: IssuesCardProps<T>) {
  const hasItems = items && items.length > 0
  const Icon = hasItems ? ActiveIcon : CheckCircle
  const iconClass = hasItems ? activeIconClass : "text-green-500"

  const customTitle = (
    <div className="flex items-center gap-2">
      <Icon className={`h-5 w-5 ${iconClass}`} />
      {title} {hasItems && `(${items.length})`}
    </div>
  )

  return (
    <DataCard
      title={customTitle}
      description={description}
      isLoading={isLoading}
      count={items?.length}
      emptyState={<EmptyState title={emptyMessage} description="" icon={CheckCircle} />}
      skeletonRows={1}
      skeletonHeight="h-32"
    >
      <div className="space-y-3">
        {items?.map((item) => (
          <div key={getItemKey(item)}>{renderItem(item)}</div>
        ))}
      </div>
    </DataCard>
  )
}
