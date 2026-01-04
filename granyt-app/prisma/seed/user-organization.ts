import { PrismaClient } from "@prisma/client";
import { hashPasswordBetterAuth, generateRandomPassword } from "./utils";

export interface UserOrgResult {
  user: Awaited<ReturnType<PrismaClient["user"]["upsert"]>>;
  organization: Awaited<ReturnType<PrismaClient["organization"]["upsert"]>>;
  password: string;
}

/**
 * Seeds the demo user, account, and organization
 * 
 * Set SEED_ADMIN_PASSWORD environment variable to use a specific password,
 * otherwise a random password will be generated.
 */
export async function seedUserAndOrganization(prisma: PrismaClient): Promise<UserOrgResult> {
  console.log("👤 Seeding user and organization...");

  // Use environment variable or generate random password
  const password = process.env.SEED_ADMIN_PASSWORD || generateRandomPassword();
  const hashedPassword = await hashPasswordBetterAuth(password);

  const user = await prisma.user.upsert({
    where: { email: "admin@granyt.dev" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@granyt.dev",
      emailVerified: true,
    },
  });

  // Create account with password for better-auth
  // better-auth expects providerId to be "credential" for email/password login
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: user.id,
      },
    },
    update: {
      password: hashedPassword,
    },
    create: {
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: hashedPassword,
    },
  });

  // Create default organization and add user as owner
  const organization = await prisma.organization.upsert({
    where: { slug: "granyt-demo" },
    update: {},
    create: {
      name: "Granyt Demo",
      slug: "granyt-demo",
      createdBy: user.id,
    },
  });

  // Add user as organization owner
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: "owner",
    },
  });

  console.log("✅ Created sample user:");
  console.log("   Email: admin@granyt.dev");
  console.log(`   Password: ${password}`);
  console.log("   ⚠️  Save this password! It won't be shown again.");
  console.log("✅ Created organization: Granyt Demo");
  console.log("   User added as owner");

  return { user, organization, password };
}
