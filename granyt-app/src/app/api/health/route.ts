import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db-health";

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const timestamp = new Date().toISOString();

  if (!dbHealth.healthy) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp,
        database: {
          connected: dbHealth.canConnect,
          migrationsApplied: dbHealth.migrationsApplied,
          error: dbHealth.error,
        },
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "ok",
    timestamp,
    database: {
      connected: true,
      migrationsApplied: true,
      migrationCount: dbHealth.migrationCount,
    },
  });
}
