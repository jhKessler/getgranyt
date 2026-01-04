import { prisma } from "@/lib/prisma";
import {
  DEFAULT_METRICS,
  MAX_SELECTED_METRICS,
  type GetMetricsSettingsParams,
  type MetricsSettingsInput,
  type MetricsSettingsResult,
} from "./types";
import { parseSelectedMetrics, serializeSelectedMetrics } from "./schemas";

/**
 * Get metrics settings for a user.
 * Falls back to default settings (dagId=null) if no DAG-specific settings exist.
 * Falls back to system default if no settings exist at all.
 */
export async function getMetricsSettings(
  params: GetMetricsSettingsParams
): Promise<MetricsSettingsResult> {
  const { userId, organizationId, dagId } = params;

  // If dagId is provided, first try to get DAG-specific settings
  if (dagId) {
    const dagSettings = await prisma.dagMetricsSettings.findUnique({
      where: {
        userId_organizationId_dagId: { userId, organizationId, dagId },
      },
    });

    if (dagSettings) {
      return {
        id: dagSettings.id,
        userId: dagSettings.userId,
        organizationId: dagSettings.organizationId,
        dagId: dagSettings.dagId,
        selectedMetrics: parseSelectedMetrics(dagSettings.selectedMetrics),
        isDefault: false,
      };
    }
  }

  // Try to get default settings (dagId = null)
  // Note: Using findFirst because Prisma's findUnique doesn't support null in compound keys
  const defaultSettings = await prisma.dagMetricsSettings.findFirst({
    where: {
      userId,
      organizationId,
      dagId: null,
    },
  });

  if (defaultSettings) {
    return {
      id: defaultSettings.id,
      userId: defaultSettings.userId,
      organizationId: defaultSettings.organizationId,
      dagId: defaultSettings.dagId,
      selectedMetrics: parseSelectedMetrics(defaultSettings.selectedMetrics),
      isDefault: true,
    };
  }

  // Return system default
  return {
    id: "",
    userId,
    organizationId,
    dagId: null,
    selectedMetrics: DEFAULT_METRICS,
    isDefault: true,
  };
}

/**
 * Save metrics settings for a user.
 * Use dagId=null for default settings, or a specific dagId for overrides.
 */
export async function saveMetricsSettings(
  params: MetricsSettingsInput
): Promise<MetricsSettingsResult> {
  const { userId, organizationId, dagId, selectedMetrics } = params;

  // Validate max enabled metrics
  const enabledCount = selectedMetrics.filter((m) => m.enabled).length;
  if (enabledCount > MAX_SELECTED_METRICS) {
    throw new Error(`Maximum ${MAX_SELECTED_METRICS} metrics can be enabled`);
  }

  // For null dagId (default settings), we need to use findFirst + create/update
  // because Prisma's upsert doesn't support null in compound keys
  if (dagId === null || dagId === undefined) {
    const existing = await prisma.dagMetricsSettings.findFirst({
      where: { userId, organizationId, dagId: null },
    });

    let result;
    if (existing) {
      result = await prisma.dagMetricsSettings.update({
        where: { id: existing.id },
        data: { selectedMetrics: serializeSelectedMetrics(selectedMetrics) },
      });
    } else {
      result = await prisma.dagMetricsSettings.create({
        data: {
          userId,
          organizationId,
          dagId: null,
          selectedMetrics: serializeSelectedMetrics(selectedMetrics),
        },
      });
    }

    return {
      id: result.id,
      userId: result.userId,
      organizationId: result.organizationId,
      dagId: result.dagId,
      selectedMetrics: parseSelectedMetrics(result.selectedMetrics),
      isDefault: true,
    };
  }

  // For specific dagId, upsert works fine
  const result = await prisma.dagMetricsSettings.upsert({
    where: {
      userId_organizationId_dagId: {
        userId,
        organizationId,
        dagId,
      },
    },
    create: {
      userId,
      organizationId,
      dagId,
      selectedMetrics: serializeSelectedMetrics(selectedMetrics),
    },
    update: {
      selectedMetrics: serializeSelectedMetrics(selectedMetrics),
    },
  });

  return {
    id: result.id,
    userId: result.userId,
    organizationId: result.organizationId,
    dagId: result.dagId,
    selectedMetrics: parseSelectedMetrics(result.selectedMetrics),
    isDefault: false,
  };
}

/**
 * Delete DAG-specific settings (to revert to default).
 * Silently succeeds if settings don't exist.
 */
export async function deleteMetricsSettings(params: {
  userId: string;
  organizationId: string;
  dagId: string;
}): Promise<void> {
  const { userId, organizationId, dagId } = params;

  try {
    await prisma.dagMetricsSettings.delete({
      where: {
        userId_organizationId_dagId: { userId, organizationId, dagId },
      },
    });
  } catch {
    // Record doesn't exist, that's fine
  }
}

/**
 * Check if a DAG has custom settings (override)
 */
export async function hasDagOverride(params: {
  userId: string;
  organizationId: string;
  dagId: string;
}): Promise<boolean> {
  const { userId, organizationId, dagId } = params;

  const settings = await prisma.dagMetricsSettings.findUnique({
    where: {
      userId_organizationId_dagId: { userId, organizationId, dagId },
    },
    select: { id: true },
  });

  return settings !== null;
}
