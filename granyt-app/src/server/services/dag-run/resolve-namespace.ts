import { prisma } from "@/lib/prisma";

/**
 * Resolves the namespace for a DAG.
 * If the provided namespace is "airflow" (default), it checks if a DAG already exists
 * for this srcDagId with a different namespace and uses that instead.
 * This prevents duplicate DAGs when different ingestion sources use different namespaces.
 */
export async function resolveNamespace(
  organizationId: string,
  srcDagId: string,
  providedNamespace: string = "airflow"
): Promise<string> {
  if (providedNamespace !== "airflow") {
    return providedNamespace;
  }

  const existingDag = await prisma.dag.findFirst({
    where: {
      organizationId,
      srcDagId,
    },
    select: { namespace: true },
    orderBy: { lastSeenAt: "desc" },
  });

  return existingDag?.namespace ?? "airflow";
}
