import { NextRequest } from "next/server";
import { z } from "zod";
import { validatePayload as zodValidate } from "@/lib/validators";
import type { ParseResult } from "./types";

/**
 * Parses and validates a JSON payload from a request.
 */
export async function parsePayload<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ParseResult<T>> {
  try {
    const rawPayload = await request.json();
    const validation = zodValidate(schema, rawPayload);

    if (!validation.success) {
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
