import { prisma } from "@/lib/prisma";

interface UpsertGeneralErrorParams {
  organizationId: string;
  fingerprint: string;
  exceptionType: string;
  message: string;
  timestamp: Date;
}

export interface UpsertGeneralErrorResult {
  id: string;
  isNew: boolean;
}

/**
 * Upserts a GeneralError record and returns its ID and whether it's new.
 */
export async function upsertGeneralError(
  params: UpsertGeneralErrorParams
): Promise<UpsertGeneralErrorResult> {
  const { organizationId, fingerprint, exceptionType, message, timestamp } = params;

  // Check if this error already exists
  const existing = await prisma.generalError.findUnique({
    where: {
      organizationId_fingerprint: {
        organizationId,
        fingerprint,
      },
    },
    select: { id: true },
  });

  const isNew = !existing;

  const generalError = await prisma.generalError.upsert({
    where: {
      organizationId_fingerprint: {
        organizationId,
        fingerprint,
      },
    },
    create: {
      organizationId,
      fingerprint,
      exceptionType,
      message,
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
      occurrenceCount: 1,
      status: "open",
    },
    update: {
      lastSeenAt: timestamp,
      occurrenceCount: { increment: 1 },
      status: "open",
      resolvedAt: null,
    },
  });

  return { id: generalError.id, isNew };
}
