import type { Organization } from "@prisma/client";

export type AuthResult =
  | { success: true; organization: Organization; apiKeyId: string; environmentId: string | null; environmentName: string | null }
  | { success: false; error: string; status: 401 };
