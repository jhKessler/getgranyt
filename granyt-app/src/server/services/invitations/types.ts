import type { Invitation, Organization, User } from "@prisma/client";

export interface CreateInvitationInput {
  organizationId: string;
  email: string;
  role: "admin" | "member";
  invitedBy: string;
  sendEmail: boolean;
}

export interface CreateInvitationResult {
  invitation: Invitation;
  inviteUrl: string;
}

export interface AcceptInvitationInput {
  token: string;
  name: string;
  password: string;
}

export interface AcceptInvitationResult {
  user: User;
  organization: Organization;
  membership: {
    id: string;
    role: string;
  };
}

export interface ValidatedInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}
