import prisma from "@/lib/prisma";

export type DbHealthStatus = {
  healthy: boolean;
  migrationsApplied: boolean;
  canConnect: boolean;
  error?: string;
  migrationCount?: number;
};

/**
 * Checks database health by verifying:
 * 1. Database connection is possible
 * 2. Migrations have been applied (by querying _prisma_migrations table)
 *
 * @returns DbHealthStatus with details about the database state
 */
export async function checkDatabaseHealth(): Promise<DbHealthStatus> {
  try {
    // Query the _prisma_migrations table to verify migrations have run
    // This table is created by Prisma when the first migration is applied
    const migrations = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM _prisma_migrations LIMIT 1
    `;

    const hasMigrations = migrations.length > 0;

    if (!hasMigrations) {
      return {
        healthy: false,
        migrationsApplied: false,
        canConnect: true,
        error:
          "Database migrations have not been applied. Run 'npx prisma migrate deploy' or ensure the migrations container completed successfully.",
      };
    }

    // Get migration count for diagnostics
    const migrationCount = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM _prisma_migrations
    `;

    return {
      healthy: true,
      migrationsApplied: true,
      canConnect: true,
      migrationCount: Number(migrationCount[0]?.count ?? 0),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check if the error is specifically about missing _prisma_migrations table
    const isMissingMigrationsTable =
      errorMessage.includes("_prisma_migrations") ||
      errorMessage.includes("does not exist") ||
      errorMessage.includes("relation") ||
      errorMessage.includes("42P01"); // PostgreSQL error code for undefined_table

    if (isMissingMigrationsTable) {
      return {
        healthy: false,
        migrationsApplied: false,
        canConnect: true,
        error:
          "Database schema not initialized. The _prisma_migrations table does not exist. Run 'npx prisma migrate deploy' or ensure the migrations container completed successfully.",
      };
    }

    // Connection or other database error
    return {
      healthy: false,
      migrationsApplied: false,
      canConnect: false,
      error: `Database connection failed: ${errorMessage}`,
    };
  }
}
