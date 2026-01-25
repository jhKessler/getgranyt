import { prisma } from "@/lib/prisma";
import {
  AlertType,
  AlertSensitivity,
  EffectiveAlertSettings,
  isBinaryAlert,
} from "../types";

/**
 * Default settings when no organization or DAG settings exist
 */
const DEFAULT_SETTINGS: EffectiveAlertSettings = {
  enabled: true,
  sensitivity: AlertSensitivity.MEDIUM,
  customThreshold: null,
  enabledEnvironments: [], // Empty = all environments
};

/**
 * Gets the effective alert settings for a specific context.
 * Priority: DAG settings > Organization settings > Defaults
 *
 * @param organizationId - The organization ID
 * @param srcDagId - The DAG ID
 * @param captureId - The capture point ID (null for DAG-level alerts)
 * @param alertType - The type of alert
 */
export async function getEffectiveSettings(
  organizationId: string,
  srcDagId: string,
  captureId: string | null,
  alertType: AlertType
): Promise<EffectiveAlertSettings> {
  // 1. Try to get DAG-specific settings
  const dagSettings = await prisma.dagAlertSettings.findUnique({
    where: {
      organizationId_srcDagId_captureId_alertType: {
        organizationId,
        srcDagId,
        captureId: captureId ?? "",
        alertType,
      },
    },
  });

  // 2. Get organization default settings
  const orgSettings = await prisma.organizationAlertSettings.findUnique({
    where: {
      organizationId_alertType: {
        organizationId,
        alertType,
      },
    },
  });

  // 3. Merge: DAG overrides org, org overrides defaults
  const orgEffective: EffectiveAlertSettings = {
    enabled: orgSettings?.enabled ?? DEFAULT_SETTINGS.enabled,
    sensitivity: orgSettings?.sensitivity ?? DEFAULT_SETTINGS.sensitivity,
    customThreshold: orgSettings?.customThreshold ?? DEFAULT_SETTINGS.customThreshold,
    enabledEnvironments: orgSettings?.enabledEnvironments ?? DEFAULT_SETTINGS.enabledEnvironments,
  };

  // If no DAG settings, use org settings
  if (!dagSettings) {
    return orgEffective;
  }

  // Merge DAG settings (null means inherit from org)
  // Note: enabledEnvironments is org-level only for now, DAG settings don't override it
  return {
    enabled: dagSettings.enabled ?? orgEffective.enabled,
    sensitivity: dagSettings.sensitivity ?? orgEffective.sensitivity,
    customThreshold: dagSettings.customThreshold ?? orgEffective.customThreshold,
    enabledEnvironments: orgEffective.enabledEnvironments,
  };
}

/**
 * Updates sensitivity for a DAG (reduces it by one level)
 */
export async function reduceDagSensitivity(
  organizationId: string,
  srcDagId: string,
  captureId: string | null,
  alertType: AlertType
): Promise<void> {
  const current = await getEffectiveSettings(
    organizationId,
    srcDagId,
    captureId,
    alertType
  );

  // For binary alerts (no sensitivity), just disable them
  if (isBinaryAlert(alertType)) {
    await prisma.dagAlertSettings.upsert({
      where: {
        organizationId_srcDagId_captureId_alertType: {
          organizationId,
          srcDagId,
          captureId: captureId ?? "",
          alertType,
        },
      },
      create: {
        organizationId,
        srcDagId,
        captureId,
        alertType,
        enabled: false,
      },
      update: {
        enabled: false,
      },
    });
    return;
  }

  const sensitivityDowngrade: Record<AlertSensitivity, AlertSensitivity> = {
    [AlertSensitivity.HIGH]: AlertSensitivity.MEDIUM,
    [AlertSensitivity.MEDIUM]: AlertSensitivity.LOW,
    [AlertSensitivity.LOW]: AlertSensitivity.DISABLED,
    [AlertSensitivity.CUSTOM]: AlertSensitivity.DISABLED,
    [AlertSensitivity.DISABLED]: AlertSensitivity.DISABLED,
  };

  const newSensitivity = sensitivityDowngrade[current.sensitivity];

  await prisma.dagAlertSettings.upsert({
    where: {
      organizationId_srcDagId_captureId_alertType: {
        organizationId,
        srcDagId,
        captureId: captureId ?? "",
        alertType,
      },
    },
    create: {
      organizationId,
      srcDagId,
      captureId,
      alertType,
      sensitivity: newSensitivity,
    },
    update: {
      sensitivity: newSensitivity,
    },
  });
}

/**
 * Sets sensitivity for a specific DAG to a specific level
 * @param customThreshold - Only used when sensitivity is CUSTOM (1-100 percentage)
 */
export async function setDagSensitivity(
  organizationId: string,
  srcDagId: string,
  captureId: string | null,
  alertType: AlertType,
  sensitivity: AlertSensitivity,
  customThreshold?: number | null,
  enabled?: boolean | null
): Promise<void> {
  await prisma.dagAlertSettings.upsert({
    where: {
      organizationId_srcDagId_captureId_alertType: {
        organizationId,
        srcDagId,
        captureId: captureId ?? "",
        alertType,
      },
    },
    create: {
      organizationId,
      srcDagId,
      captureId,
      alertType,
      sensitivity,
      customThreshold: sensitivity === AlertSensitivity.CUSTOM ? customThreshold : null,
      enabled: enabled ?? true,
    },
    update: {
      sensitivity,
      customThreshold: sensitivity === AlertSensitivity.CUSTOM ? customThreshold : null,
      enabled: enabled !== undefined ? enabled : undefined,
    },
  });
}
