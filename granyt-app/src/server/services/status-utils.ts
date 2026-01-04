import { DagRunStatus, AlertStatus } from "@prisma/client";

// Re-export for convenience
export { DagRunStatus };

/**
 * Display status for UI (computed from DagRunStatus + open alerts count)
 * This mirrors the Prisma enum but is defined here since the enum isn't used by any model
 */
export enum DisplayStatus {
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  WARNING = "WARNING", // Success but has open alerts
}

/**
 * Computes the display status based on the raw run status and open alerts count.
 * 
 * Logic:
 * - If status is SUCCESS and there are open alerts → WARNING
 * - Otherwise → same as the raw status
 * 
 * This allows WARNING to be dynamic:
 * - When an alert is dismissed/acknowledged → no longer OPEN → WARNING disappears
 * - When an alert is reopened → becomes OPEN again → WARNING returns
 */
export function getDisplayStatus(
  status: DagRunStatus,
  openAlertCount: number
): DisplayStatus {
  if (status === DagRunStatus.SUCCESS && openAlertCount > 0) {
    return DisplayStatus.WARNING;
  }

  // Map DagRunStatus to DisplayStatus (they have the same values except WARNING)
  switch (status) {
    case DagRunStatus.RUNNING:
      return DisplayStatus.RUNNING;
    case DagRunStatus.SUCCESS:
      return DisplayStatus.SUCCESS;
    case DagRunStatus.FAILED:
      return DisplayStatus.FAILED;
    default:
      return DisplayStatus.RUNNING;
  }
}

/**
 * Converts DisplayStatus enum to lowercase string for API responses
 */
export function displayStatusToString(status: DisplayStatus): string {
  return status.toLowerCase();
}

/**
 * Converts DagRunStatus enum to lowercase string
 */
export function dagRunStatusToString(status: DagRunStatus): string {
  return status.toLowerCase();
}

/**
 * Helper to check if alert status counts as "open" for WARNING calculation
 */
export function isAlertOpen(alertStatus: AlertStatus): boolean {
  return alertStatus === AlertStatus.OPEN;
}

/**
 * Type for the _count include pattern used to count open alerts
 */
export const OPEN_ALERTS_COUNT_SELECT = {
  alerts: { where: { status: AlertStatus.OPEN } },
} as const;

/**
 * Type helper for runs with status and alert count
 */
export type RunWithAlertCount = {
  status: DagRunStatus;
  _count: { alerts: number };
};

/**
 * Get display status from a run object with alert count included
 */
export function getDisplayStatusFromRun(run: RunWithAlertCount): DisplayStatus {
  return getDisplayStatus(run.status, run._count.alerts);
}

/**
 * Get display status as string from a run object with alert count included
 */
export function getDisplayStatusStringFromRun(run: RunWithAlertCount): string {
  return displayStatusToString(getDisplayStatusFromRun(run));
}
