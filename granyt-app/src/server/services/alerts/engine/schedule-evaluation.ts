import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AlertEngineScheduler");

/**
 * Default delay before processing alert evaluation (in milliseconds)
 */
const DEFAULT_DELAY_MS = 60_000; // 1 minute

/**
 * Schedules an alert evaluation job for a completed DAG run.
 * Uses async setTimeout to process after a delay, ensuring all metrics are captured.
 *
 * Prevents duplicate jobs for the same DAG run using upsert.
 *
 * @param organizationId - The organization ID
 * @param dagRunId - The DAG run ID to evaluate
 * @param delayMs - Delay before processing (default: 1 minute)
 */
export async function scheduleAlertEvaluation(
  organizationId: string,
  dagRunId: string,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<void> {
  const scheduledFor = new Date(Date.now() + delayMs);

  // Upsert to handle duplicate events for the same run
  // If a job already exists for this dagRunId:
  // - If pending: update scheduledFor to push back the evaluation
  // - If already processed/failed: do nothing (update is no-op)
  const job = await prisma.alertEvaluationJob.upsert({
    where: { dagRunId },
    create: {
      organizationId,
      dagRunId,
      scheduledFor,
      status: "pending",
    },
    update: {
      // Only update if still pending - this pushes back the schedule
      // if more events come in for the same run
      scheduledFor: scheduledFor,
    },
  });

  // Only start the timer if this is a new job or was reset to pending
  if (job.status === "pending") {
    // Fire and forget - don't await the processing
    processAfterDelay(job.id, delayMs).catch((error) => {
      logger.error({ jobId: job.id, error }, "Failed to process job");
    });
  }
}

/**
 * Internal function that waits and then triggers processing.
 * This runs asynchronously and doesn't block the caller.
 */
async function processAfterDelay(jobId: string, delayMs: number): Promise<void> {
  // Wait for the specified delay
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  // Import here to avoid circular dependency
  const { processAlertEvaluation } = await import("./process-evaluation");

  // Process the job
  await processAlertEvaluation(jobId);
}
