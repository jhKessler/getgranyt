import { prisma } from "@/lib/prisma";
import { parseColumnsFromSchema } from "@/lib/json-schemas";
import {
  AlertDetector,
  DetectorContext,
  DetectionResult,
  EffectiveAlertSettings,
  AlertType,
  ColumnInfo,
} from "../types";

/**
 * Represents a schema change detected between two metric captures
 */
interface SchemaChange {
  type: "added" | "removed" | "type_changed";
  columnName: string;
  previousType?: string;
  currentType?: string;
}

/**
 * Fetches the most recent previous metric for the same capture point
 * to compare schema against
 */
async function getPreviousMetric(
  organizationId: string,
  captureId: string
): Promise<ColumnInfo[] | null> {
  const previousMetric = await prisma.metric.findFirst({
    where: {
      organizationId,
      captureId,
    },
    select: {
      metrics: true,
      schema: true,
    },
    orderBy: {
      capturedAt: "desc",
    },
    skip: 1, // Skip the current (most recent) metric
  });

  if (!previousMetric) {
    return null;
  }

  return parseColumnsFromSchema(previousMetric.schema);
}

/**
 * Compares two column schemas and returns the differences
 */
function compareSchemas(
  previousColumns: ColumnInfo[],
  currentColumns: ColumnInfo[]
): SchemaChange[] {
  const changes: SchemaChange[] = [];

  const previousByName = new Map(previousColumns.map((c) => [c.name, c]));
  const currentByName = new Map(currentColumns.map((c) => [c.name, c]));

  // Check for removed columns
  for (const [name, prevCol] of previousByName) {
    if (!currentByName.has(name)) {
      changes.push({
        type: "removed",
        columnName: name,
        previousType: prevCol.dtype,
      });
    }
  }

  // Check for added columns and type changes
  for (const [name, currCol] of currentByName) {
    const prevCol = previousByName.get(name);

    if (!prevCol) {
      changes.push({
        type: "added",
        columnName: name,
        currentType: currCol.dtype,
      });
    } else if (prevCol.dtype !== currCol.dtype) {
      changes.push({
        type: "type_changed",
        columnName: name,
        previousType: prevCol.dtype,
        currentType: currCol.dtype,
      });
    }
  }

  return changes;
}

/**
 * Schema Change Detector
 *
 * Detects when the schema of a dataframe has changed between DAG runs.
 * This includes:
 * - New columns added
 * - Columns removed
 * - Column data type changes
 *
 * This helps catch unexpected schema drift that could break downstream processes.
 */
export const schemaChangeDetector: AlertDetector = {
  type: AlertType.SCHEMA_CHANGE,

  async detect(
    ctx: DetectorContext,
    settings: EffectiveAlertSettings
  ): Promise<DetectionResult | null> {
    // Skip if no column data or disabled
    if (!ctx.columns || ctx.columns.length === 0) {
      return null;
    }
    if (!ctx.captureId) {
      return null;
    }
    if (!settings.enabled) {
      return null;
    }

    // Get the previous metric for comparison
    const previousColumns = await getPreviousMetric(
      ctx.organizationId,
      ctx.captureId
    );

    // No previous metric to compare against (first run)
    if (!previousColumns || previousColumns.length === 0) {
      return null;
    }

    // Compare schemas
    const changes = compareSchemas(previousColumns, ctx.columns);

    // No changes detected
    if (changes.length === 0) {
      return null;
    }

    // Categorize changes
    const addedColumns = changes.filter((c) => c.type === "added");
    const removedColumns = changes.filter((c) => c.type === "removed");
    const typeChangedColumns = changes.filter((c) => c.type === "type_changed");

    // Determine severity based on type of changes (no sensitivity config)
    // Breaking changes (removals/type changes) = critical, only additions = warning
    const _breakingChanges = removedColumns.length + typeChangedColumns.length;
    // TODO: When adding critical event types, uncomment this line:
    // const computedSeverity = breakingChanges >= 1 ? "critical" : "warning";
    const severity: "warning" | "critical" = "warning"; // All current events are warnings for now

    return {
      shouldAlert: true,
      severity,
      metadata: {
        changes,
        summary: {
          addedCount: addedColumns.length,
          removedCount: removedColumns.length,
          typeChangedCount: typeChangedColumns.length,
          totalChanges: changes.length,
        },
        addedColumns: addedColumns.map((c) => ({
          name: c.columnName,
          type: c.currentType,
        })),
        removedColumns: removedColumns.map((c) => ({
          name: c.columnName,
          type: c.previousType,
        })),
        typeChangedColumns: typeChangedColumns.map((c) => ({
          name: c.columnName,
          previousType: c.previousType,
          currentType: c.currentType,
        })),
        previousColumnCount: previousColumns.length,
        currentColumnCount: ctx.columns.length,
      },
    };
  },
};
