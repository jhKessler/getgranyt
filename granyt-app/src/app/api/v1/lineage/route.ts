import { NextRequest, NextResponse } from "next/server";
import { openlineageEventSchema } from "@/lib/validators";
import {
  extractApiKey,
  validateApiKey,
  parsePayload,
  ingestLineage,
} from "@/server/services";
import { createLogger } from "@/lib/logger";

const logger = createLogger("LineageApi");

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API key
    const auth = await validateApiKey(extractApiKey(request.headers));
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 2. Parse and validate payload
    const payload = await parsePayload(request, openlineageEventSchema);
    if (!payload.success) {
      return NextResponse.json(
        { error: "Validation failed", details: payload.error, issues: payload.details?.errors },
        { status: 400 }
      );
    }

    // 3. Ingest lineage event
    const result = await ingestLineage({
      organizationId: auth.organization.id,
      environment: auth.environmentName,
      event: payload.data,
    });

    return NextResponse.json({
      status: "received",
      eventType: result.eventType,
      isTaskLevel: result.isTaskLevel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Internal server error in lineage ingestion");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "granyt-openlineage",
    timestamp: new Date().toISOString(),
  });
}
