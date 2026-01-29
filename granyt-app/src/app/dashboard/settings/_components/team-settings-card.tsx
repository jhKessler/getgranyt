"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  UserPlus,
  MoreVertical,
  Shield,
  User,
  UserX,
  UserCheck,
  Copy,
  Loader2,
  Mail,
  Link as LinkIcon,
  Clock,
  Send,
  X,
} from "lucide-react";
import { useTeamManagement } from "../_hooks";
import { toast } from "sonner";

interface TeamSettingsCardProps {
  currentUserId: string;
}

export function TeamSettingsCard({ currentUserId }: TeamSettingsCardProps) {
  const {
    members,
    invitations,
    isLoading,
    handleUpdateMemberRole,
    handleToggleMemberStatus,
    handleCreateInvitation,
    handleRevokeInvitation,
    handleResendInvitation,
    isUpdatingRole,
    isTogglingStatus,
    isCreatingInvitation,
    isRevokingInvitation,
    isResendingInvitation,
    isEmailAvailable,
  } = useTeamManagement();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [sendEmailInvite, setSendEmailInvite] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(
    null
  );

  const handleInviteSubmit = async () => {
    if (!inviteEmail) return;

    // Only send email if available AND toggle is on
    const shouldSendEmail = isEmailAvailable && sendEmailInvite;

    const result = await handleCreateInvitation(
      inviteEmail,
      inviteRole,
      shouldSendEmail
    );

    if (result) {
      // Always show the generated invite URL
      setGeneratedInviteUrl(result.inviteUrl);
    }
  };

  const resetInviteDialog = () => {
    setIsInviteDialogOpen(false);
    setInviteEmail("");
    setInviteRole("member");
    setSendEmailInvite(false);
    setGeneratedInviteUrl(null);
  };

  const copyInviteUrl = () => {
    if (generatedInviteUrl) {
      navigator.clipboard.writeText(generatedInviteUrl);
      toast.success("Invite link copied to clipboard");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="default" className="bg-amber-500 hover:bg-amber-500">
            <Shield className="mr-1 h-3 w-3" />
            Owner
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="secondary">
            <Shield className="mr-1 h-3 w-3" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <User className="mr-1 h-3 w-3" />
            Member
          </Badge>
        );
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge
        variant="outline"
        className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
      >
        Active
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
      >
        Deactivated
      </Badge>
    );
  };

  const formatTimeRemaining = (expiresAt: Date | string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Team Management</CardTitle>
          </div>
          <CardDescription>Manage your team members and invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <div>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Manage your team members and invitations
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Members Section */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              MEMBERS ({members?.length ?? 0})
            </h3>
            <div className="space-y-2">
              {members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.user.name}
                        {member.user.id === currentUserId && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    {getStatusBadge(member.user.isActive)}
                    {member.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isUpdatingRole || isTogglingStatus}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role === "admin" ? (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateMemberRole(member.id, "member")
                              }
                            >
                              <User className="mr-2 h-4 w-4" />
                              Make Member
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateMemberRole(member.id, "admin")
                              }
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {member.user.isActive ? (
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleMemberStatus(member.user.id, false)
                              }
                              className="text-red-600 focus:text-red-600"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleMemberStatus(member.user.id, true)
                              }
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations Section */}
          {invitations && invitations.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                PENDING INVITATIONS ({invitations.length})
              </h3>
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border border-dashed p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Invited by {invitation.inviter.name}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            Expires in {formatTimeRemaining(invitation.expiresAt)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(invitation.role)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(invitation.id)}
                        disabled={isResendingInvitation}
                      >
                        {isResendingInvitation ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Resend
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeInvitation(invitation.id)}
                        disabled={isRevokingInvitation}
                        className="text-red-600 hover:text-red-600"
                      >
                        {isRevokingInvitation ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={resetInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your team
            </DialogDescription>
          </DialogHeader>

          {generatedInviteUrl ? (
            // Show generated link
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <Label className="text-sm font-medium">
                  {isEmailAvailable && sendEmailInvite
                    ? "Invitation sent! You can also share this link:"
                    : "Share this link with your teammate"}
                </Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={generatedInviteUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="sm" onClick={copyInviteUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  This link expires in 7 days
                </p>
              </div>
              <DialogFooter>
                <Button onClick={resetInviteDialog}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            // Show invite form
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as "admin" | "member")}
                >
                  <SelectTrigger className="h-auto min-h-11 py-2.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <p>Member</p>
                          <p className="text-xs text-muted-foreground">
                            Can view dashboards and data
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <div>
                          <p>Admin</p>
                          <p className="text-xs text-muted-foreground">
                            Can manage team and settings
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email option - only show if email is configured */}
              {isEmailAvailable ? (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Also send email notification
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Email will be sent along with the invite link
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={sendEmailInvite}
                    onCheckedChange={setSendEmailInvite}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Invite link will be generated
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Configure email in settings to send invitations via email
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={resetInviteDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteSubmit}
                  disabled={!inviteEmail || isCreatingInvitation}
                >
                  {isCreatingInvitation ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isEmailAvailable && sendEmailInvite ? (
                    <Send className="mr-2 h-4 w-4" />
                  ) : (
                    <LinkIcon className="mr-2 h-4 w-4" />
                  )}
                  {isEmailAvailable && sendEmailInvite
                    ? "Send Invitation"
                    : "Create Invite Link"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
