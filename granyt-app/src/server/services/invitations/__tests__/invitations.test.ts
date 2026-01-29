import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateInvitationToken } from "../validate-token";
import { createInvitation } from "../create-invitation";
import { acceptInvitation } from "../accept-invitation";
import { listPendingInvitations } from "../list-invitations";
import { revokeInvitation } from "../revoke-invitation";

// Mock the email sending module
vi.mock("../send-invitation-email", () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock env
vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://app.granyt.dev",
  },
}));

// Create mock prisma client
const mockPrisma = {
  invitation: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  organizationMember: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  account: {
    create: vi.fn(),
  },
  organization: {
    findFirst: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe("Invitation Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateInvitationToken", () => {
    it("should return null for empty token", async () => {
      const result = await validateInvitationToken(mockPrisma as any, "");
      expect(result).toBeNull();
    });

    it("should return null for invalid token format (too short)", async () => {
      const result = await validateInvitationToken(mockPrisma as any, "abc123");
      expect(result).toBeNull();
    });

    it("should return null for invalid token format (non-hex)", async () => {
      const result = await validateInvitationToken(
        mockPrisma as any,
        "g".repeat(64) // 'g' is not a valid hex character
      );
      expect(result).toBeNull();
    });

    it("should return null for non-existent token", async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(null);

      const result = await validateInvitationToken(
        mockPrisma as any,
        "a".repeat(64)
      );
      expect(result).toBeNull();
    });

    it("should return null for already accepted invitation", async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue({
        id: "inv-1",
        token: "a".repeat(64),
        acceptedAt: new Date(),
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        organization: { id: "org-1", name: "Test Org", slug: "test-org" },
        inviter: { id: "user-1", name: "John", email: "john@test.com" },
      });

      const result = await validateInvitationToken(
        mockPrisma as any,
        "a".repeat(64)
      );
      expect(result).toBeNull();
    });

    it("should return null for revoked invitation", async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue({
        id: "inv-1",
        token: "a".repeat(64),
        acceptedAt: null,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        organization: { id: "org-1", name: "Test Org", slug: "test-org" },
        inviter: { id: "user-1", name: "John", email: "john@test.com" },
      });

      const result = await validateInvitationToken(
        mockPrisma as any,
        "a".repeat(64)
      );
      expect(result).toBeNull();
    });

    it("should return null for expired invitation", async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue({
        id: "inv-1",
        token: "a".repeat(64),
        acceptedAt: null,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 86400000), // expired yesterday
        organization: { id: "org-1", name: "Test Org", slug: "test-org" },
        inviter: { id: "user-1", name: "John", email: "john@test.com" },
      });

      const result = await validateInvitationToken(
        mockPrisma as any,
        "a".repeat(64)
      );
      expect(result).toBeNull();
    });

    it("should return invitation details for valid token", async () => {
      const token = "a".repeat(64);
      const expiresAt = new Date(Date.now() + 86400000);

      mockPrisma.invitation.findUnique.mockResolvedValue({
        id: "inv-1",
        email: "jane@test.com",
        role: "member",
        token,
        acceptedAt: null,
        revokedAt: null,
        expiresAt,
        organization: { id: "org-1", name: "Test Org", slug: "test-org" },
        inviter: { id: "user-1", name: "John", email: "john@test.com" },
      });

      const result = await validateInvitationToken(mockPrisma as any, token);

      expect(result).toEqual({
        id: "inv-1",
        email: "jane@test.com",
        role: "member",
        expiresAt,
        organization: { id: "org-1", name: "Test Org", slug: "test-org" },
        inviter: { id: "user-1", name: "John", email: "john@test.com" },
      });
    });
  });

  describe("createInvitation", () => {
    it("should throw if user is already a member", async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue({
        id: "member-1",
      });

      await expect(
        createInvitation(mockPrisma as any, {
          organizationId: "org-1",
          email: "jane@test.com",
          role: "member",
          invitedBy: "user-1",
          sendEmail: false,
        })
      ).rejects.toThrow("User is already a member of this organization");
    });

    it("should throw if active invitation already exists", async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.findFirst.mockResolvedValue({ id: "inv-1" });

      await expect(
        createInvitation(mockPrisma as any, {
          organizationId: "org-1",
          email: "jane@test.com",
          role: "member",
          invitedBy: "user-1",
          sendEmail: false,
        })
      ).rejects.toThrow("An active invitation already exists for this email");
    });

    it("should create invitation with correct expiry", async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue({
        id: "inv-1",
        email: "jane@test.com",
        token: "abc123",
        organization: { name: "Test Org" },
        inviter: { name: "John" },
      });

      const result = await createInvitation(mockPrisma as any, {
        organizationId: "org-1",
        email: "jane@test.com",
        role: "member",
        invitedBy: "user-1",
        sendEmail: false,
      });

      expect(mockPrisma.invitation.create).toHaveBeenCalled();
      const createCall = mockPrisma.invitation.create.mock.calls[0][0];
      expect(createCall.data.email).toBe("jane@test.com");
      expect(createCall.data.role).toBe("member");
      expect(createCall.data.token).toHaveLength(64);

      // Check expiration is ~7 days from now
      const expiresAt = new Date(createCall.data.expiresAt);
      const now = new Date();
      const diffDays = Math.round(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(7);

      expect(result.inviteUrl).toContain("https://app.granyt.dev/invite/");
    });

    it("should normalize email to lowercase", async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue({
        id: "inv-1",
        email: "jane@test.com",
        token: "abc123",
        organization: { name: "Test Org" },
        inviter: { name: "John" },
      });

      await createInvitation(mockPrisma as any, {
        organizationId: "org-1",
        email: "JANE@TEST.COM",
        role: "member",
        invitedBy: "user-1",
        sendEmail: false,
      });

      const createCall = mockPrisma.invitation.create.mock.calls[0][0];
      expect(createCall.data.email).toBe("jane@test.com");
    });
  });

  describe("listPendingInvitations", () => {
    it("should return only pending invitations", async () => {
      mockPrisma.invitation.findMany.mockResolvedValue([
        {
          id: "inv-1",
          email: "jane@test.com",
          role: "member",
          expiresAt: new Date(),
          createdAt: new Date(),
          inviter: { id: "user-1", name: "John", email: "john@test.com" },
        },
      ]);

      const result = await listPendingInvitations(mockPrisma as any, "org-1");

      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        include: {
          inviter: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("jane@test.com");
    });
  });

  describe("revokeInvitation", () => {
    it("should throw if invitation not found", async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue(null);

      await expect(
        revokeInvitation(mockPrisma as any, "inv-1", "org-1")
      ).rejects.toThrow("Invitation not found");
    });

    it("should throw if invitation already accepted", async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue({
        id: "inv-1",
        acceptedAt: new Date(),
        revokedAt: null,
      });

      await expect(
        revokeInvitation(mockPrisma as any, "inv-1", "org-1")
      ).rejects.toThrow("Cannot revoke an accepted invitation");
    });

    it("should throw if invitation already revoked", async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue({
        id: "inv-1",
        acceptedAt: null,
        revokedAt: new Date(),
      });

      await expect(
        revokeInvitation(mockPrisma as any, "inv-1", "org-1")
      ).rejects.toThrow("Invitation is already revoked");
    });

    it("should revoke valid invitation", async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue({
        id: "inv-1",
        acceptedAt: null,
        revokedAt: null,
      });
      mockPrisma.invitation.update.mockResolvedValue({
        id: "inv-1",
        revokedAt: new Date(),
      });

      await revokeInvitation(mockPrisma as any, "inv-1", "org-1");

      expect(mockPrisma.invitation.update).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe("security", () => {
    it("should generate tokens with 256-bit entropy (64 hex chars)", async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue({
        id: "inv-1",
        token: "a".repeat(64),
        organization: { name: "Test" },
        inviter: { name: "John" },
      });

      await createInvitation(mockPrisma as any, {
        organizationId: "org-1",
        email: "test@test.com",
        role: "member",
        invitedBy: "user-1",
        sendEmail: false,
      });

      const createCall = mockPrisma.invitation.create.mock.calls[0][0];
      expect(createCall.data.token).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(createCall.data.token)).toBe(true);
    });

    it("should reject tokens that are too short", async () => {
      const result = await validateInvitationToken(
        mockPrisma as any,
        "a".repeat(32)
      );
      expect(result).toBeNull();
    });

    it("should reject non-hex tokens", async () => {
      const result = await validateInvitationToken(
        mockPrisma as any,
        "z".repeat(64)
      );
      expect(result).toBeNull();
    });
  });
});
