import { NextRequest } from "next/server";
import { z } from "zod";
import { validatePayload as zodValidate } from "@/lib/validators";

interface ParseArrayResult<T> {
  success: boolean;
  items: T[];
  errors: Array<{ index: number; error: string }>;
}

/**
 * Parses a payload that can be a single item, an array, or wrapped in a container key.
 * Returns an array of validated items and any validation errors.
 */
export async function parseArrayPayload<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  containerKey?: string
): Promise<ParseArrayResult<T>> {
  try {
    const rawPayload = await request.json();
    const rawItems = extractItems(rawPayload, containerKey);

    return validateItems(rawItems, schema);
  } catch {
    return {
      success: false,
      items: [],
      errors: [{ index: 0, error: "Invalid JSON payload" }],
    };
  }
}

function extractItems(rawPayload: unknown, containerKey?: string): unknown[] {
  if (containerKey && typeof rawPayload === "object" && rawPayload !== null) {
    const payloadObj = rawPayload as Record<string, unknown>;
    const items = payloadObj[containerKey];
    if (Array.isArray(items)) {
      return items;
    }
  }

  if (Array.isArray(rawPayload)) {
    return rawPayload;
  }

  return [rawPayload];
}

function validateItems<T>(
  rawItems: unknown[],
  schema: z.ZodSchema<T>
): { success: boolean; items: T[]; errors: Array<{ index: number; error: string }> } {
  const items: T[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < rawItems.length; i++) {
    const validation = zodValidate(schema, rawItems[i]);

    if (validation.success) {
      items.push(validation.data);
    } else {
      errors.push({ index: i, error: validation.error });
    }
  }

  return {
    success: items.length > 0,
    items,
    errors,
  };
}
