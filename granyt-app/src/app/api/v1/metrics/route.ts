import { NextRequest, NextResponse } from "next/server";
import { metricsPayloadSchema } from "@/lib/validators";
import {
  extractApiKey,
  validateApiKey,
  parsePayload,
  ingestMetrics,
} from "@/server/services";
import { createLogger } from "@/lib/logger";

const logger = createLogger("MetricsApi");

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API key
    const auth = await validateApiKey(extractApiKey(request.headers));
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 2. Parse and validate payload
    const payload = await parsePayload(request, metricsPayloadSchema);
    if (!payload.success) {
      return NextResponse.json(
        { error: "Validation failed", details: payload.error, issues: payload.details?.errors },
        { status: 400 }
      );
    }

    // 3. Ingest metrics
    const result = await ingestMetrics({
      organizationId: auth.organization.id,
      environment: auth.environmentName,
      payload: payload.data,
    });

    return NextResponse.json({
      status: "received",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Internal server error in metrics ingestion");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "granyt-metrics",
    timestamp: new Date().toISOString(),
  });
}
