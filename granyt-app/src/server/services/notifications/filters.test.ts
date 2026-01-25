import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getUserNotificationFilters,
  updateUserNotificationFilters,
  getDefaultEnvironmentName,
  shouldSendNotificationToUser,
  filterRecipientsByPreferences,
} from "./filters";
import { prisma } from "@/lib/prisma";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    userNotificationFilters: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    environment: {
      findFirst: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

describe("NotificationFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserNotificationFilters", () => {
    it("should return default filters when no user filters exist", async () => {
      vi.mocked(prisma.userNotificationFilters.findUnique).mockResolvedValue(null);

      const result = await getUserNotificationFilters("user-1");

      expect(result).toEqual({
        environmentFilter: "all",
        includeManualRuns: true,
      });
    });

    it("should return user filters when they exist", async () => {
      vi.mocked(prisma.userNotificationFilters.findUnique).mockResolvedValue({
        id: "filter-1",
        userId: "user-1",
        environmentFilter: "default_only",
        includeManualRuns: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await getUserNotificationFilters("user-1");

      expect(result).toEqual({
        environmentFilter: "default_only",
        includeManualRuns: false,
      });
    });
  });

  describe("updateUserNotificationFilters", () => {
    it("should upsert user filters", async () => {
      vi.mocked(prisma.userNotificationFilters.upsert).mockResolvedValue({
        id: "filter-1",
        userId: "user-1",
        environmentFilter: "default_only",
        includeManualRuns: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateUserNotificationFilters("user-1", {
        environmentFilter: "default_only",
      });

      expect(prisma.userNotificationFilters.upsert).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        create: {
          userId: "user-1",
          environmentFilter: "default_only",
        },
        update: {
          environmentFilter: "default_only",
        },
      });
    });
  });

  describe("getDefaultEnvironmentName", () => {
    it("should return the default environment name", async () => {
      vi.mocked(prisma.environment.findFirst).mockResolvedValue({
        id: "env-1",
        organizationId: "org-1",
        name: "production",
        isDefault: true,
        airflowUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await getDefaultEnvironmentName("org-1");

      expect(result).toBe("production");
      expect(prisma.environment.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          isDefault: true,
        },
        select: { name: true },
      });
    });

    it("should return null when no default environment exists", async () => {
      vi.mocked(prisma.environment.findFirst).mockResolvedValue(null);

      const result = await getDefaultEnvironmentName("org-1");

      expect(result).toBeNull();
    });
  });

  describe("shouldSendNotificationToUser", () => {
    it("should return true when user has default filters (all envs, include manual)", async () => {
      vi.mocked(prisma.userNotificationFilters.findUnique).mockResolvedValue(null);

      const result = await shouldSendNotificationToUser("user-1", "org-1", {
        environment: "staging",
        runType: "manual",
      });

      expect(result).toBe(true);
    });

    it("should return false for non-default env when filter is default_only", async () => {
      vi.mocked(prisma.userNotificationFilters.findUnique).mockResolvedValue({
        id: "filter-1",
        userId: "user-1",
        environmentFilter: "default_only",
        includeManualRuns: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.environment.findFirst).mockResolvedValue({
        id: "env-1",
        organizationId: "org-1",
        name: "production",
        isDefault: true,
        airflowUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await shouldSendNotificationToUser("user-1", "org-1", {
        environment: "staging", // Not the default (production)
        runType: "scheduled",
      });

      expect(result).toBe(false);
    });

    it("should return true for default env when filter is default_only", async () => {
      vi.mocked(prisma.userNotificationFilters.findUnique).mockResolvedValue({
        id: "filter-1",
        userId: "user-1",
        environmentFilter: "default_only",
        includeManualRuns: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.environment.findFirst).mockResolvedValue({
        id: "env-1",
        organizationId: "org-1",
        name: "production",
        isDefault: true,
        airflowUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await shouldSendNotificationToUser("user-1", "org-1", {
        environment: "production", // Matches default
        runType: "scheduled",
      });

      expect(result).toBe(true);
    });

    it("should return false for manual runs when includeManualRuns is false", async () => {
      vi.mocked(prisma.userNotificationFilters.findUnique).mockResolvedValue({
        id: "filter-1",
        userId: "user-1",
        environmentFilter: "all",
        includeManualRuns: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await shouldSendNotificationToUser("user-1", "org-1", {
        environment: "production",
        runType: "manual",
      });

      expect(result).toBe(false);
    });

    it("should return true for scheduled runs when includeManualRuns is false", async () => {
      vi.mocked(prisma.userNotificationFilters.findUnique).mockResolvedValue({
        id: "filter-1",
        userId: "user-1",
        environmentFilter: "all",
        includeManualRuns: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await shouldSendNotificationToUser("user-1", "org-1", {
        environment: "production",
        runType: "scheduled",
      });

      expect(result).toBe(true);
    });

    it("should handle combined filters (default_only AND no manual runs)", async () => {
      vi.mocked(prisma.userNotificationFilters.findUnique).mockResolvedValue({
        id: "filter-1",
        userId: "user-1",
        environmentFilter: "default_only",
        includeManualRuns: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.environment.findFirst).mockResolvedValue({
        id: "env-1",
        organizationId: "org-1",
        name: "production",
        isDefault: true,
        airflowUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // production + scheduled = OK
      const result1 = await shouldSendNotificationToUser("user-1", "org-1", {
        environment: "production",
        runType: "scheduled",
      });
      expect(result1).toBe(true);

      // staging + scheduled = NOT OK (wrong env)
      const result2 = await shouldSendNotificationToUser("user-1", "org-1", {
        environment: "staging",
        runType: "scheduled",
      });
      expect(result2).toBe(false);

      // production + manual = NOT OK (manual disabled)
      const result3 = await shouldSendNotificationToUser("user-1", "org-1", {
        environment: "production",
        runType: "manual",
      });
      expect(result3).toBe(false);
    });
  });

  describe("filterRecipientsByPreferences", () => {
    it("should return all recipients when no context provided", async () => {
      const recipients = [
        { email: "user1@example.com", name: "User 1" },
        { email: "user2@example.com", name: "User 2" },
      ];

      const result = await filterRecipientsByPreferences("org-1", recipients, {});

      expect(result).toEqual(recipients);
    });

    it("should filter out recipients based on their individual preferences", async () => {
      const recipients = [
        { email: "user1@example.com", name: "User 1" },
        { email: "user2@example.com", name: "User 2" },
      ];

      // Mock users lookup
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: "user-1", email: "user1@example.com" },
        { id: "user-2", email: "user2@example.com" },
      ] as any);

      // User 1 has manual runs disabled, User 2 has default filters
      vi.mocked(prisma.userNotificationFilters.findUnique)
        .mockResolvedValueOnce({
          id: "filter-1",
          userId: "user-1",
          environmentFilter: "all",
          includeManualRuns: false, // User 1 doesn't want manual runs
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce(null); // User 2 uses defaults

      const result = await filterRecipientsByPreferences("org-1", recipients, {
        environment: "production",
        runType: "manual",
      });

      // Only user2 should be included (user1 has manual runs disabled)
      expect(result).toEqual([{ email: "user2@example.com", name: "User 2" }]);
    });

    it("should include recipients not found in database", async () => {
      const recipients = [
        { email: "unknown@example.com", name: "Unknown User" },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      const result = await filterRecipientsByPreferences("org-1", recipients, {
        environment: "staging",
        runType: "manual",
      });

      // Unknown user should be included by default
      expect(result).toEqual(recipients);
    });
  });
});
