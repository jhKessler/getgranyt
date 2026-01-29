"use client";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useTeamManagement() {
  const utils = trpc.useUtils();

  // Get organization ID
  const { data: organizations } = trpc.organization.list.useQuery();
  const organizationId = organizations?.[0]?.id;

  // ============================================================================
  // MEMBERS
  // ============================================================================

  const {
    data: members,
    isLoading: isLoadingMembers,
    error: membersError,
  } = trpc.team.listMembers.useQuery(
    { organizationId: organizationId! },
    { enabled: !!organizationId }
  );

  const updateMemberRole = trpc.team.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Member role updated");
      utils.team.listMembers.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const toggleMemberStatus = trpc.team.toggleMemberStatus.useMutation({
    onSuccess: (_, variables) => {
      toast.success(
        variables.isActive ? "Member reactivated" : "Member deactivated"
      );
      utils.team.listMembers.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleUpdateMemberRole = (
    memberId: string,
    role: "admin" | "member"
  ) => {
    if (!organizationId) return;
    updateMemberRole.mutate({ organizationId, memberId, role });
  };

  const handleToggleMemberStatus = (userId: string, isActive: boolean) => {
    if (!organizationId) return;
    toggleMemberStatus.mutate({ organizationId, userId, isActive });
  };

  // ============================================================================
  // INVITATIONS
  // ============================================================================

  const {
    data: invitations,
    isLoading: isLoadingInvitations,
    error: invitationsError,
  } = trpc.team.listInvitations.useQuery(
    { organizationId: organizationId! },
    { enabled: !!organizationId }
  );

  // Check if email is configured for sending invitations
  const { data: emailConfig, isLoading: isLoadingEmailConfig } =
    trpc.team.checkEmailConfigured.useQuery(
      { organizationId: organizationId! },
      { enabled: !!organizationId }
    );

  const createInvitation = trpc.team.createInvitation.useMutation({
    onSuccess: (result, variables) => {
      if (variables.sendEmail) {
        toast.success(`Invitation sent to ${variables.email}`);
      } else {
        toast.success("Invitation created - copy the link to share");
      }
      utils.team.listInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create invitation: ${error.message}`);
    },
  });

  const revokeInvitation = trpc.team.revokeInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation revoked");
      utils.team.listInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to revoke invitation: ${error.message}`);
    },
  });

  const resendInvitation = trpc.team.resendInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation resent");
      utils.team.listInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to resend invitation: ${error.message}`);
    },
  });

  const handleCreateInvitation = async (
    email: string,
    role: "admin" | "member",
    sendEmail: boolean
  ) => {
    if (!organizationId) return null;
    const result = await createInvitation.mutateAsync({
      organizationId,
      email,
      role,
      sendEmail,
    });
    return result;
  };

  const handleRevokeInvitation = (invitationId: string) => {
    if (!organizationId) return;
    revokeInvitation.mutate({ organizationId, invitationId });
  };

  const handleResendInvitation = (invitationId: string) => {
    if (!organizationId) return;
    resendInvitation.mutate({ organizationId, invitationId });
  };

  return {
    // Organization
    organizationId,

    // Members
    members,
    isLoadingMembers,
    membersError,
    handleUpdateMemberRole,
    handleToggleMemberStatus,
    isUpdatingRole: updateMemberRole.isPending,
    isTogglingStatus: toggleMemberStatus.isPending,

    // Invitations
    invitations,
    isLoadingInvitations,
    invitationsError,
    handleCreateInvitation,
    handleRevokeInvitation,
    handleResendInvitation,
    isCreatingInvitation: createInvitation.isPending,
    isRevokingInvitation: revokeInvitation.isPending,
    isResendingInvitation: resendInvitation.isPending,

    // Email configuration
    isEmailAvailable: emailConfig?.isEmailAvailable ?? false,

    // Combined loading state
    isLoading: isLoadingMembers || isLoadingInvitations || isLoadingEmailConfig,
  };
}
