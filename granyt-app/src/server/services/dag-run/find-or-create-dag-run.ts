import { prisma } from "@/lib/prisma";
import { DagRunStatus } from "@prisma/client";
import { inferRunType } from "./infer-run-type";
import type { FindOrCreateDagRunParams } from "./types";

/**
 * Finds or creates a DagRun record.
 */
export async function findOrCreateDagRun(
  params: FindOrCreateDagRunParams
): Promise<{ id: string }> {
  const { organizationId, srcDagId, srcRunId, timestamp, environment } = params;
  const namespace = params.namespace ?? "airflow";

  const existingRun = await prisma.dagRun.findFirst({
    where: {
      organizationId,
      srcDagId,
      srcRunId,
      environment: environment ?? null,
    },
  });

  if (existingRun) {
    // Update namespace if it was default and we have better info now
    if (existingRun.namespace === "airflow" && namespace !== "airflow") {
      await prisma.dagRun.update({
        where: { id: existingRun.id },
        data: { namespace },
      });
    }
    return { id: existingRun.id };
  }

  const newRun = await prisma.dagRun.create({
    data: {
      organizationId,
      srcDagId,
      namespace,
      srcRunId,
      status: DagRunStatus.RUNNING,
      startTime: timestamp,
      runType: inferRunType(srcRunId),
      environment,
    },
  });

  return { id: newRun.id };
}
