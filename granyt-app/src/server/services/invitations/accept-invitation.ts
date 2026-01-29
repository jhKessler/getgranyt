import type { PrismaClient } from "@prisma/client";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { validateInvitationToken } from "./validate-token";
import type { AcceptInvitationInput, AcceptInvitationResult } from "./types";

const scryptAsync = promisify(scrypt);

/**
 * Hash password using the same scrypt format as Better Auth.
 * This allows the user to log in via the normal auth flow after accepting.
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Accepts an invitation by creating a new user and organization membership.
 * Creates the user directly via Prisma, bypassing Better Auth's signup hook.
 */
export async function acceptInvitation(
  prisma: PrismaClient,
  input: AcceptInvitationInput
): Promise<AcceptInvitationResult> {
  const { token, name, password } = input;

  // Validate the token first
  const validatedInvitation = await validateInvitationToken(prisma, token);

  if (!validatedInvitation) {
    throw new Error("Invalid or expired invitation");
  }

  // Check if user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedInvitation.email },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  // Validate password length
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  if (password.length > 128) {
    throw new Error("Password must be at most 128 characters");
  }

  // Validate name
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    throw new Error("Name must be at least 2 characters");
  }

  if (trimmedName.length > 100) {
    throw new Error("Name must be at most 100 characters");
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Use a transaction to create user, account, and membership atomically
  const result = await prisma.$transaction(async (tx) => {
    // Create the user
    const user = await tx.user.create({
      data: {
        email: validatedInvitation.email,
        name: trimmedName,
        emailVerified: true, // Email is verified via invitation
        isActive: true,
      },
    });

    // Create the account (Better Auth credential account)
    await tx.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      },
    });

    // Create the organization membership
    const membership = await tx.organizationMember.create({
      data: {
        organizationId: validatedInvitation.organization.id,
        userId: user.id,
        role: validatedInvitation.role,
      },
    });

    // Mark the invitation as accepted
    await tx.invitation.update({
      where: { id: validatedInvitation.id },
      data: { acceptedAt: new Date() },
    });

    // Fetch the full organization
    const organization = await tx.organization.findUniqueOrThrow({
      where: { id: validatedInvitation.organization.id },
    });

    return {
      user,
      organization,
      membership: {
        id: membership.id,
        role: membership.role,
      },
    };
  });

  return result;
}
