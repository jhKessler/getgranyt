import { PrismaClient, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { ErrorSummary } from "./types";
import { ErrorStatus } from "./types";
import { getEnvironmentFilter } from "./helpers";

type ErrorWithOccurrences = Prisma.GeneralErrorGetPayload<{
  include: {
    occurrences: {
      include: {
        taskRun: {
          select: {
            srcTaskId: true,
            environment: true,
            dagRunId: true,
            dagRun: { 
              select: { 
                id: true,
                srcDagId: true, 
                srcRunId: true,
                environment: true,
              } 
            },
          },
        },
      },
    },
  },
}>;

interface ErrorSummaryInput {
  id: string;
  exceptionType: string;
  message: string;
  occurrenceCount: number;
  lastSeenAt: Date;
  firstSeenAt: Date;
  status: string;
  occurrences: {
    taskRun?: {
      environment?: string | null;
      dagRun?: {
        srcDagId?: string | null;
        environment?: string | null;
      } | null;
    } | null;
  }[];
}

export async function getRecentErrors(
  prisma: PrismaClient,
  orgId: string,
  limit: number,
  environment?: string | null
): Promise<ErrorSummary[]> {
  const envFilter = getEnvironmentFilter(environment ?? null);

  const errors = await prisma.generalError.findMany({
    where: {
      organizationId: orgId,
      status: "open",
      occurrences: {
        some: {
          taskRun: { 
            environment: envFilter,
            dagRun: { dag: { disabled: false } },
          },
        },
      },
    },
    orderBy: { lastSeenAt: "desc" },
    take: limit,
    include: {
      occurrences: {
        select: {
          taskRun: {
            select: { 
              environment: true,
              dagRun: { 
                select: { 
                  srcDagId: true,
                  environment: true,
                } 
              } 
            },
          },
        },
      },
    },
  });

  return errors.map((e) => formatErrorSummary(e, envFilter));
}

export async function getErrorsByEnvironmentType(
  prisma: PrismaClient,
  orgId: string,
  type: "default" | "non-default",
  limit: number,
  defaultEnvironmentName?: string,
  nonDefaultEnvironmentNames?: string[]
): Promise<ErrorSummary[]> {
  let envFilter: string | { in: string[] } | { not: string };

  if (type === "default") {
    // Filter to only the default environment
    if (!defaultEnvironmentName) {
      return []; // No default environment set, return empty
    }
    envFilter = defaultEnvironmentName;
  } else {
    // Filter to all non-default environments
    if (nonDefaultEnvironmentNames && nonDefaultEnvironmentNames.length > 0) {
      envFilter = { in: nonDefaultEnvironmentNames };
    } else if (defaultEnvironmentName) {
      envFilter = { not: defaultEnvironmentName };
    } else {
      // No default environment, show all
      envFilter = { not: "" }; // This will match all environments
    }
  }

  const errors = await prisma.generalError.findMany({
    where: {
      organizationId: orgId,
      status: "open",
      occurrences: {
        some: {
          taskRun: { 
            environment: envFilter,
            dagRun: { dag: { disabled: false } },
          },
        },
      },
    },
    orderBy: { lastSeenAt: "desc" },
    take: limit,
    include: {
      occurrences: {
        where: {
          taskRun: { environment: envFilter },
        },
        select: {
          taskRun: {
            select: { 
              environment: true,
              dagRun: { 
                select: { 
                  srcDagId: true,
                  environment: true,
                } 
              } 
            },
          },
        },
      },
    },
  });

  return errors.map((e) => formatErrorSummary(e));
}

function formatErrorSummary(error: ErrorSummaryInput, _envFilter?: string): ErrorSummary {
  const uniqueDags = new Set(
    error.occurrences
      .map((o) => o.taskRun?.dagRun?.srcDagId)
      .filter(Boolean)
  );

  const environments = new Set<string>(
    error.occurrences
      .map((o) => o.taskRun?.environment || o.taskRun?.dagRun?.environment)
      .filter((env: unknown): env is string => Boolean(env))
  );

  return {
    id: error.id,
    exceptionType: error.exceptionType,
    message: error.message,
    occurrenceCount: error.occurrenceCount,
    dagCount: uniqueDags.size,
    lastSeenAt: error.lastSeenAt,
    firstSeenAt: error.firstSeenAt,
    status: error.status,
    environments: Array.from(environments),
  };
}

export async function getErrorDetails(
  prisma: PrismaClient,
  orgId: string,
  errorId: string
) {
  const error = await prisma.generalError.findFirst({
    where: { id: errorId, organizationId: orgId },
    include: {
      occurrences: {
        orderBy: { timestamp: "desc" },
        take: 50,
        include: {
          taskRun: {
            select: {
              srcTaskId: true,
              environment: true,
              dagRunId: true,
              dagRun: { 
                select: { 
                  id: true,
                  srcDagId: true, 
                  srcRunId: true,
                  environment: true,
                } 
              },
            },
          },
        },
      },
    },
  });

  if (!error) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Error not found" });
  }

  return formatErrorDetails(error);
}

function formatErrorDetails(error: ErrorWithOccurrences) {
  const environments = new Set<string>();

  const occurrences = error.occurrences.map((occurrence) => {
    const env = occurrence.taskRun?.environment || occurrence.taskRun?.dagRun?.environment;
    if (env) environments.add(env);

    return {
      ...occurrence,
      dagId: occurrence.taskRun?.dagRun?.srcDagId ?? null,
      taskId: occurrence.taskRun?.srcTaskId ?? null,
      runId: occurrence.taskRun?.dagRun?.srcRunId ?? null,
      dagRunId: occurrence.taskRun?.dagRun?.id ?? null,
      environment: env ?? null,
    };
  });

  return {
    ...error,
    occurrences,
    environments: Array.from(environments),
  };
}

export async function updateErrorStatus(
  prisma: PrismaClient,
  orgId: string,
  errorId: string,
  status: ErrorStatus
) {
  const error = await prisma.generalError.findFirst({
    where: { id: errorId, organizationId: orgId },
  });

  if (!error) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Error not found" });
  }

  return prisma.generalError.update({
    where: { id: errorId },
    data: {
      status,
      resolvedAt: status === ErrorStatus.Resolved ? new Date() : null,
    },
  });
}

export async function getRunErrorOccurrences(
  prisma: PrismaClient,
  orgId: string,
  dagRunId: string
) {
  const occurrences = await prisma.errorOccurrence.findMany({
    where: { 
      organizationId: orgId,
      taskRun: {
        dagRunId: dagRunId,
      },
    },
    include: {
      generalError: {
        select: {
          id: true,
          exceptionType: true,
          message: true,
        },
      },
      taskRun: {
        select: {
          srcTaskId: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });

  return occurrences.map((o) => ({
    id: o.id,
    taskId: o.taskRun?.srcTaskId ?? null,
    exceptionType: o.generalError.exceptionType,
    message: o.generalError.message,
    errorId: o.generalError.id,
    timestamp: o.timestamp,
    tryNumber: o.tryNumber,
    operator: o.operator,
    stacktrace: o.stacktrace,
  }));
}
