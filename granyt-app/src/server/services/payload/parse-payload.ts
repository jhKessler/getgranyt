import { NextRequest } from "next/server";
import { z } from "zod";
import { validatePayload as zodValidate } from "@/lib/validators";
import { createLogger } from "@/lib/logger";
import type { ParseResult } from "./types";

const logger = createLogger("PayloadParser");

/**
 * Parses and validates a JSON payload from a request.
 */
export async function parsePayload<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ParseResult<T>> {
  try {
    const rawPayload = await request.json();
    console.log("Raw payload:", rawPayload);
    const validation = zodValidate(schema, rawPayload);

    if (!validation.success) {
      logger.error(
        {
          error: validation.error,
          issues: validation.details.errors,
          path: request.nextUrl.pathname,
        },
        "Schema validation failed"
      );
      return {
        success: false,
        error: validation.error,
        details: validation.details,
      };
    }

    return { success: true, data: validation.data };
  } catch {
    return {
      success: false,
      error: "Invalid JSON payload",
    };
  }
}
