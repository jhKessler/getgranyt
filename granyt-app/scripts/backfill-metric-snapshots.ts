/**
 * Script to backfill DagRunMetricSnapshots for existing DAG runs.
 * Run with: npx ts-node scripts/backfill-metric-snapshots.ts
 */

import { PrismaClient } from "@prisma/client";
import { parseMetricsJson, getNumericMetric } from "../src/lib/json-schemas";

const prisma = new PrismaClient();

async function backfillMetricSnapshots() {
  console.log("Starting metric snapshot backfill...");

  // Get all DAG runs that don't have a metric snapshot
  const runs = await prisma.dagRun.findMany({
    where: {
      metricSnapshot: null,
    },
    include: {
      taskRuns: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  console.log(`Found ${runs.length} runs without metric snapshots`);

  let created = 0;
  let errors = 0;

  for (const dagRun of runs) {
    try {
      // Calculate built-in metrics
      const taskCount = dagRun.taskRuns.length;
      const successfulTasks = dagRun.taskRuns.filter((t) => t.status === "success").length;
      const successRate = taskCount > 0 ? (successfulTasks / taskCount) * 100 : null;

      // Get error count for this run
      const errorCount = await prisma.errorOccurrence.count({
        where: {
          taskRun: { dagRunId: dagRun.id },
        },
      });

      // Get all metrics for this run and aggregate row_count
      const metrics = await prisma.metric.findMany({
        where: {
          organizationId: dagRun.organizationId,
          taskRun: { dagRunId: dagRun.id },
        },
        select: { metrics: true },
      });

      // Sum row counts and aggregate custom metrics
      let totalRowCount = 0;
      const aggregatedCustomMetrics: Record<string, number> = {};
      
      for (const m of metrics) {
        const parsed = parseMetricsJson(m.metrics);
        // Extract row_count from metrics
        const rowCount = getNumericMetric(parsed, "row_count");
        if (rowCount !== null) {
          totalRowCount += rowCount;
        }
        // Aggregate all numeric metrics
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === "number" && key !== "row_count") {
            aggregatedCustomMetrics[key] = (aggregatedCustomMetrics[key] ?? 0) + value;
          }
        }
      }
      
      const rowsProcessed = BigInt(totalRowCount);

      // Create the metric snapshot
      await prisma.dagRunMetricSnapshot.create({
        data: {
          organizationId: dagRun.organizationId,
          dagRunId: dagRun.id,
          srcDagId: dagRun.srcDagId,
          environment: dagRun.environment,
          duration: dagRun.duration,
          rowsProcessed,
          taskCount,
          errorCount,
          successRate,
          customMetrics:
            Object.keys(aggregatedCustomMetrics).length > 0
              ? aggregatedCustomMetrics
              : undefined,
        },
      });

      created++;
      if (created % 100 === 0) {
        console.log(`Created ${created}/${runs.length} snapshots...`);
      }
    } catch (error) {
      console.error(`Error creating snapshot for run ${dagRun.id}:`, error);
      errors++;
    }
  }

  console.log(`\nBackfill complete!`);
  console.log(`Created: ${created}`);
  console.log(`Errors: ${errors}`);
}

backfillMetricSnapshots()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
