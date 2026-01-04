import { AlertStatus, DagRunStatus, PrismaClient } from "@prisma/client";

/**
 * Computes DAG metrics for all DAGs in the organization
 * Aggregates metrics by environment and timeframe
 */
export async function computeDAGMetrics(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  console.log("\n📊 Computing DAG metrics...");

  // First, create metric snapshots for all DAG runs
  await createDagRunMetricSnapshots(prisma, organizationId);

  const allDags = await prisma.dag.findMany({
    where: { organizationId },
    select: { srcDagId: true },
  });

  const allEnvironments = ["production", "development", "staging", null]; // null = combined
  const allTimeframes = ["24h", "7d", "30d"];

  for (const dag of allDags) {
    for (const env of allEnvironments) {
      for (const timeframe of allTimeframes) {
        await computeMetricsForDag(prisma, organizationId, dag.srcDagId, env, timeframe);
      }
    }
    console.log(`   ✅ Computed metrics for ${dag.srcDagId}`);
  }
}

/**
 * Creates DagRunMetricSnapshot records for all DAG runs
 * This is needed for the Run History chart to display data
 */
async function createDagRunMetricSnapshots(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  console.log("   📸 Creating metric snapshots for DAG runs...");

  const dagRuns = await prisma.dagRun.findMany({
    where: { organizationId },
    include: {
      taskRuns: {
        select: { id: true, status: true },
      },
    },
  });

  for (const dagRun of dagRuns) {
    // Calculate built-in metrics
    const taskCount = dagRun.taskRuns.length;
    const successfulTasks = dagRun.taskRuns.filter((t) => t.status === "success").length;
    const successRate = taskCount > 0 ? (successfulTasks / taskCount) * 100 : null;

    // Get error count for this run
    const errorCount = await prisma.errorOccurrence.count({
      where: { taskRun: { dagRunId: dagRun.id } },
    });

    // Get rows processed and custom metrics from metrics
    const metricsForRun = await prisma.metric.findMany({
      where: {
        organizationId,
        taskRun: { dagRunId: dagRun.id },
      },
      select: { metrics: true },
    });
    
    // Sum row_count from metrics JSON and merge custom metrics
    let rowsProcessed = BigInt(0);
    let customMetrics: Record<string, number> | null = null;
    for (const m of metricsForRun) {
      if (m.metrics && typeof m.metrics === 'object') {
        const metricsObj = m.metrics as Record<string, unknown>;
        if (typeof metricsObj.row_count === 'number') {
          rowsProcessed += BigInt(metricsObj.row_count);
        }
        // Extract custom metrics (non-standard fields)
        const standardFields = ['row_count', 'column_count', 'memory_bytes', 'dataframe_type', 'columns', 'upstream'];
        for (const [key, value] of Object.entries(metricsObj)) {
          if (!standardFields.includes(key) && typeof value === 'number') {
            if (!customMetrics) customMetrics = {};
            customMetrics[key] = value;
          }
        }
      }
    }

    await prisma.dagRunMetricSnapshot.upsert({
      where: { dagRunId: dagRun.id },
      create: {
        organizationId,
        dagRunId: dagRun.id,
        srcDagId: dagRun.srcDagId,
        environment: dagRun.environment,
        duration: dagRun.duration,
        rowsProcessed,
        taskCount,
        errorCount,
        successRate,
        customMetrics: customMetrics ?? undefined,
      },
      update: {
        duration: dagRun.duration,
        rowsProcessed,
        taskCount,
        errorCount,
        successRate,
        customMetrics: customMetrics ?? undefined,
      },
    });
  }

  console.log(`   ✅ Created ${dagRuns.length} metric snapshots`);
}

async function computeMetricsForDag(
  prisma: PrismaClient,
  organizationId: string,
  srcDagId: string,
  env: string | null,
  timeframe: string
): Promise<void> {
  // Get cutoff date for this timeframe
  const now = new Date();
  const cutoffMs =
    timeframe === "24h"
      ? 24 * 60 * 60 * 1000
      : timeframe === "7d"
      ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(now.getTime() - cutoffMs);

  // Get all runs within timeframe including computed status
  const runs = await prisma.dagRun.findMany({
    where: {
      organizationId,
      srcDagId,
      environment: env ?? undefined,
      startTime: { gte: cutoff },
    },
    select: {
      id: true,
      status: true,
      duration: true,
      _count: {
        select: { alerts: { where: { status: AlertStatus.OPEN } } },
      },
    },
  });

  if (runs.length === 0) return;

  // Aggregate run metrics
  let totalRuns = 0;
  let successfulRuns = 0;
  let failedRuns = 0;
  let totalDuration = BigInt(0);
  let customMetricsAgg: Record<string, { sum: number; count: number; lastValue: number }> | null = null;

  for (const run of runs) {
    totalRuns++;
    const status = run.status;
    // SUCCESS with open alerts is still considered successful for metrics
    if (status === DagRunStatus.SUCCESS) successfulRuns++;
    else if (status === DagRunStatus.FAILED) failedRuns++;
    totalDuration += BigInt(run.duration ?? 0);

    // Aggregate custom metrics from Metric for this run
    const runMetrics = await prisma.metric.findMany({
      where: {
        organizationId,
        taskRun: { dagRunId: run.id },
      },
      select: { metrics: true },
    });

    const standardFields = ['row_count', 'column_count', 'memory_bytes', 'dataframe_type', 'columns', 'upstream'];
    for (const m of runMetrics) {
      if (m.metrics && typeof m.metrics === 'object') {
        const metricsObj = m.metrics as Record<string, unknown>;
        if (!customMetricsAgg) customMetricsAgg = {};
        for (const [key, value] of Object.entries(metricsObj)) {
          if (!standardFields.includes(key) && typeof value === 'number') {
            if (customMetricsAgg[key]) {
              customMetricsAgg[key].sum += value;
              customMetricsAgg[key].count += 1;
              customMetricsAgg[key].lastValue = value;
            } else {
              customMetricsAgg[key] = { sum: value, count: 1, lastValue: value };
            }
          }
        }
      }
    }
  }

  // Get row counts from metrics
  const allMetrics = await prisma.metric.findMany({
    where: {
      organizationId,
      taskRun: {
        dagRun: {
          srcDagId,
          environment: env ?? undefined,
          startTime: { gte: cutoff },
        },
      },
    },
    select: { metrics: true },
  });
  
  let totalRowsSum = BigInt(0);
  for (const m of allMetrics) {
    if (m.metrics && typeof m.metrics === 'object') {
      const metricsObj = m.metrics as Record<string, unknown>;
      if (typeof metricsObj.row_count === 'number') {
        totalRowsSum += BigInt(metricsObj.row_count);
      }
    }
  }

  // Create the computed metrics record
  await prisma.dagComputedMetrics.create({
    data: {
      organizationId,
      dagId: srcDagId,
      environment: env,
      timeframe,
      totalRuns,
      successfulRuns,
      failedRuns,
      totalRows: totalRowsSum,
      totalDuration,
      customMetrics: customMetricsAgg ?? undefined,
      lastComputedAt: new Date(),
    },
  });
}
