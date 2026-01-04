import { prisma } from "@/lib/prisma";
import { resolveNamespace } from "./resolve-namespace";
import type { EnsureDagParams } from "./types";

/**
 * Ensures a DAG record exists and updates its last seen timestamp.
 */
export async function ensureDagExists(params: EnsureDagParams): Promise<void> {
  const { organizationId, srcDagId, timestamp, schedule } = params;
  
  const namespace = await resolveNamespace(
    organizationId, 
    srcDagId, 
    params.namespace ?? "airflow"
  );

  await prisma.dag.upsert({
    where: {
      organizationId_srcDagId_namespace: {
        organizationId,
        srcDagId,
        namespace,
      },
    },
    create: {
      organizationId,
      srcDagId,
      namespace,
      lastSeenAt: timestamp,
      schedule,
    },
    update: {
      lastSeenAt: timestamp,
      ...(schedule && { schedule }),
    },
  });
}
