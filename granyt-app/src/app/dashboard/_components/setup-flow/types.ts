export interface SetupMilestone {
  id: string
  label: string
  shortLabel: string
  description: string
  isComplete: boolean
}

export const STORAGE_KEY = "granyt-setup-flow-dismissed-milestone-count"
