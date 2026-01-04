import { NextRequest, NextResponse } from "next/server";
import { errorEventSchema } from "@/lib/validators";
import {
  extractApiKey,
  validateApiKey,
  parseArrayPayload,
  ingestErrors,
} from "@/server/services";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ErrorsApi");

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API key
    const auth = await validateApiKey(extractApiKey(request.headers));
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 2. Parse and validate payload (supports single, array, or {errors: []} format)
    const payload = await parseArrayPayload(request, errorEventSchema, "errors");
    if (!payload.success) {
      return NextResponse.json(
        { error: "Validation failed for all error events", details: payload.errors },
        { status: 400 }
      );
    }

    // 3. Ingest errors
    await ingestErrors(auth.organization.id, payload.items, auth.environmentName);

    return NextResponse.json({
      status: "received",
      count: payload.items.length,
      skipped: payload.errors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Internal server error in error ingestion");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "granyt-errors",
    timestamp: new Date().toISOString(),
  });
}
