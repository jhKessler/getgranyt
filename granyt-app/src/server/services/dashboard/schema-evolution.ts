import { PrismaClient } from "@prisma/client";
import { getEnvironmentFilter } from "./helpers";
import { parseColumnsFromSchema } from "@/lib/json-schemas";

/**
 * Column info for schema tracking
 */
export interface SchemaColumn {
  name: string;
  dtype: string;
}

/**
 * Schema snapshot at a point in time
 */
export interface SchemaSnapshot {
  runId: string;
  srcRunId: string;
  startTime: string;
  columns: SchemaColumn[];
}

/**
 * Schema change event
 */
export interface SchemaChange {
  type: "added" | "removed" | "dtype_changed";
  columnName: string;
  oldDtype?: string;
  newDtype?: string;
  firstSeenRunId: string;
  firstSeenSrcRunId: string;
  firstSeenTime: string;
}

/**
 * Schema evolution data for a capture point
 */
export interface CaptureSchemaEvolution {
  captureId: string;
  taskId: string;
  currentColumns: SchemaColumn[];
  changes: SchemaChange[];
  snapshots: SchemaSnapshot[];
}

/**
 * Get schema evolution data for a specific DAG.
 * Tracks column additions, removals, and dtype changes over time.
 */
export async function getSchemaEvolution(
  prisma: PrismaClient,
  orgId: string,
  dagId: string,
  startDate: Date | null,
  environment?: string | null,
  limit: number = 50
): Promise<CaptureSchemaEvolution[]> {
  const envFilter = getEnvironmentFilter(environment ?? null);

  // Get all metrics for this DAG within the timeframe
  const metrics = await prisma.metric.findMany({
    where: {
      organizationId: orgId,
      taskRun: {
        dagRun: {
          srcDagId: dagId,
          ...(startDate && { startTime: { gte: startDate } }),
          dag: { disabled: false },
          environment: envFilter,
        },
      },
    },
    include: {
      taskRun: {
        include: {
          dagRun: {
            select: {
              id: true,
              srcRunId: true,
              startTime: true,
            },
          },
        },
      },
    },
    orderBy: { capturedAt: "asc" },
  });

  // Group by captureId
  const captureMap = new Map<string, {
    captureId: string;
    taskId: string;
    snapshots: SchemaSnapshot[];
  }>();

  for (const metric of metrics) {
    if (!metric.taskRun?.dagRun) continue;

    const { dagRun } = metric.taskRun;
    const captureId = metric.captureId;
    const columns = parseColumnsFromSchema(metric.schema);

    if (!captureMap.has(captureId)) {
      captureMap.set(captureId, {
        captureId,
        taskId: metric.taskRun.srcTaskId,
        snapshots: [],
      });
    }

    const capture = captureMap.get(captureId)!;
    
    capture.snapshots.push({
      runId: dagRun.id,
      srcRunId: dagRun.srcRunId,
      startTime: dagRun.startTime.toISOString(),
      columns: columns.map(c => ({ name: c.name, dtype: c.dtype })),
    });
  }

  // Process each capture to detect schema changes
  const results: CaptureSchemaEvolution[] = [];

  for (const [, capture] of captureMap) {
    // Sort snapshots by time
    capture.snapshots.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Limit snapshots
    const limitedSnapshots = capture.snapshots.slice(-limit);

    // Detect changes
    const changes: SchemaChange[] = [];
    const seenColumns = new Map<string, { dtype: string; snapshot: SchemaSnapshot }>();

    for (const snapshot of limitedSnapshots) {
      const currentColumnNames = new Set(snapshot.columns.map(c => c.name));

      // Check for new columns or dtype changes
      for (const col of snapshot.columns) {
        const existing = seenColumns.get(col.name);
        
        if (!existing) {
          // New column (only mark as "added" if this isn't the first snapshot)
          if (seenColumns.size > 0 || limitedSnapshots.indexOf(snapshot) > 0) {
            changes.push({
              type: "added",
              columnName: col.name,
              newDtype: col.dtype,
              firstSeenRunId: snapshot.runId,
              firstSeenSrcRunId: snapshot.srcRunId,
              firstSeenTime: snapshot.startTime,
            });
          }
          seenColumns.set(col.name, { dtype: col.dtype, snapshot });
        } else if (existing.dtype !== col.dtype) {
          // Dtype changed
          changes.push({
            type: "dtype_changed",
            columnName: col.name,
            oldDtype: existing.dtype,
            newDtype: col.dtype,
            firstSeenRunId: snapshot.runId,
            firstSeenSrcRunId: snapshot.srcRunId,
            firstSeenTime: snapshot.startTime,
          });
          seenColumns.set(col.name, { dtype: col.dtype, snapshot });
        }
      }

      // Check for removed columns (only if we've seen columns before)
      if (seenColumns.size > 0) {
        for (const [colName, { snapshot: lastSnapshot }] of seenColumns) {
          if (!currentColumnNames.has(colName) && lastSnapshot !== snapshot) {
            // Check if we haven't already recorded this removal
            const alreadyRemoved = changes.some(
              c => c.type === "removed" && c.columnName === colName
            );
            if (!alreadyRemoved) {
              changes.push({
                type: "removed",
                columnName: colName,
                oldDtype: seenColumns.get(colName)?.dtype,
                firstSeenRunId: snapshot.runId,
                firstSeenSrcRunId: snapshot.srcRunId,
                firstSeenTime: snapshot.startTime,
              });
            }
          }
        }
      }
    }

    // Get current schema (from latest snapshot)
    const latestSnapshot = limitedSnapshots[limitedSnapshots.length - 1];
    const currentColumns = latestSnapshot?.columns || [];

    results.push({
      captureId: capture.captureId,
      taskId: capture.taskId,
      currentColumns,
      changes,
      snapshots: limitedSnapshots,
    });
  }

  // Sort by average capture time
  results.sort((a, b) => {
    const avgA = a.snapshots.reduce((sum, s) => sum + new Date(s.startTime).getTime(), 0) / (a.snapshots.length || 1);
    const avgB = b.snapshots.reduce((sum, s) => sum + new Date(s.startTime).getTime(), 0) / (b.snapshots.length || 1);
    return avgA - avgB;
  });

  return results;
}
