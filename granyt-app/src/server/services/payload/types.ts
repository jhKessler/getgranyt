import { z } from "zod";

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: z.ZodError };
