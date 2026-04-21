"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    GetWorkspaces,
    GetWorkspaceMembers,
    GetPendingInvites,
    InviteMember,
    RemoveMember,
    UpdateMemberRole,
    RevokeInvite,
} from "@/app/(dashboard)/_actions/workspaces";
import MemberPermissionsDialog from "./MemberPermissionsDialog";
import WorkspaceJoinQRCode from "./WorkspaceJoinQRCode";
import CreateWorkspaceDialog from "@/components/CreateWorkspaceDialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Users,
    UserPlus,
    Crown,
    Shield,
    Eye,
    Pencil,
    Trash2,
    Mail,
    Copy,
    Check,
    Clock,
    X,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const ROLE_CONFIG: Record<
    string,
    { label: string; icon: React.ReactNode; color: string; description: string }
> = {
    ADMIN: {
        label: "Admin",
        icon: <Crown className="h-3.5 w-3.5" />,
        color: "bg-amber-500/15 text-amber-600 border-amber-500/30",
        description: "Full access. Can invite, edit, delete, and manage members.",
    },
    EDITOR: {
        label: "Editor",
        icon: <Pencil className="h-3.5 w-3.5" />,
        color: "bg-blue-500/15 text-blue-600 border-blue-500/30",
        description: "Can add, edit, and delete transactions and budgets.",
    },
    VIEWER: {
        label: "Viewer",
        icon: <Eye className="h-3.5 w-3.5" />,
        color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
        description: "Read-only access. Can view data but not make changes.",
    },
};

export function WorkspaceMembers() {
    const { data: workspaces, isLoading: isLoadingWorkspaces } = useQuery({
        queryKey: ["workspaces"],
        queryFn: () => GetWorkspaces(),
    });

    if (isLoadingWorkspaces) {
        return (
            <Card className="border border-border bg-card/50 backdrop-blur-sm">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    const personalWorkspaces = workspaces?.filter((w: any) => w.role === "ADMIN") || [];
    const joinedWorkspaces = workspaces?.filter((w: any) => w.role !== "ADMIN") || [];

    return (
        <div className="space-y-6">
            {personalWorkspaces.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Your Workspace</h3>
                        <CreateWorkspaceDialog />
                    </div>
                    {personalWorkspaces.map((workspace: any) => (
                        <WorkspaceCard key={workspace.id} workspace={workspace} />
                    ))}
                </div>
            )}

            {joinedWorkspaces.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Joined Workspaces</h3>
                    {joinedWorkspaces.map((workspace: any) => (
                        <WorkspaceCard key={workspace.id} workspace={workspace} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface Workspace {
    id: string;
    name: string;
    role: string;
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
    const queryClient = useQueryClient();
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("VIEWER");
    const [copiedLink, setCopiedLink] = useState<string | null>(null);

    const { data: members, isLoading: isMembersLoading } = useQuery({
        queryKey: ["workspace-members", workspace.id],
        queryFn: () => GetWorkspaceMembers(workspace.id),
        enabled: !!workspace.id,
    });

    const { data: invites, isLoading: isInvitesLoading } = useQuery({
        queryKey: ["workspace-invites", workspace.id],
        queryFn: () => GetPendingInvites(workspace.id),
        enabled: !!workspace.id,
    });

    const isAdmin = workspace.role === "ADMIN";

    const inviteMutation = useMutation({
        mutationFn: ({
            email,
            role,
        }: {
            email: string;
            role: string;
        }) => InviteMember(workspace.id, email, role),
        onSuccess: (data) => {
            toast.success("Invite sent!", {
                description: "The invite link has been generated.",
            });
            setInviteEmail("");
            setInviteRole("VIEWER");
            setInviteDialogOpen(false);
            queryClient.invalidateQueries({
                queryKey: ["workspace-invites"],
            });

            // Copy the invite link
            if (data.inviteLink) {
                navigator.clipboard.writeText(data.inviteLink);
                toast.info("Invite link copied to clipboard!", {
                    description: "Share this link with the person you want to invite.",
                });
            }
        },
        onError: (e: Error) => {
            toast.error(e.message || "Failed to send invite");
        },
    });

    const removeMutation = useMutation({
        mutationFn: (memberUserId: string) =>
            RemoveMember(workspace.id, memberUserId),
        onSuccess: () => {
            toast.success("Member removed");
            queryClient.invalidateQueries({
                queryKey: ["workspace-members"],
            });
        },
        onError: (e: Error) => {
            toast.error(e.message || "Failed to remove member");
        },
    });

    const roleMutation = useMutation({
        mutationFn: ({
            userId,
            role,
        }: {
            userId: string;
            role: string;
        }) => UpdateMemberRole(workspace.id, userId, role),
        onSuccess: () => {
            toast.success("Role updated");
            queryClient.invalidateQueries({
                queryKey: ["workspace-members"],
            });
        },
        onError: (e: Error) => {
            toast.error(e.message || "Failed to update role");
        },
    });

    const revokeInviteMutation = useMutation({
        mutationFn: (inviteId: string) => RevokeInvite(inviteId),
        onSuccess: () => {
            toast.success("Invite revoked");
            queryClient.invalidateQueries({
                queryKey: ["workspace-invites"],
            });
        },
        onError: (e: Error) => {
            toast.error(e.message || "Failed to revoke invite");
        },
    });

    const handleCopyLink = useCallback(
        async (token: string) => {
            const link = `${window.location.origin
                }/join?token=${token}`;
            await navigator.clipboard.writeText(link);
            setCopiedLink(token);
            toast.success("Invite link copied!");
            setTimeout(() => setCopiedLink(null), 2000);
        },
        []
    );



    return (
        <Card className="border border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                Workspace & Family
                            </CardTitle>
                            <CardDescription>
                                {workspace?.name || "Personal Workspace"} •{" "}
                                {members?.length || 0} member
                                {(members?.length || 0) !== 1 ? "s" : ""}
                            </CardDescription>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-2">
                            <WorkspaceJoinQRCode workspaceId={workspace.id} workspaceName={workspace.name} />
                            <Dialog
                                open={inviteDialogOpen}
                                onOpenChange={setInviteDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        className="gap-2 bg-primary hover:bg-primary/90"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            Invite Member
                                        </span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Invite a Member</DialogTitle>
                                    <DialogDescription>
                                        Invite someone to collaborate on your
                                        budget. They&apos;ll receive a link to
                                        join.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-4 py-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">
                                            Email Address
                                        </label>
                                        <Input
                                            placeholder="partner@example.com"
                                            value={inviteEmail}
                                            onChange={(e) =>
                                                setInviteEmail(e.target.value)
                                            }
                                            type="email"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">
                                            Role
                                        </label>
                                        <Select
                                            value={inviteRole}
                                            onValueChange={setInviteRole}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(ROLE_CONFIG).map(
                                                    ([key, config]) => (
                                                        <SelectItem
                                                            key={key}
                                                            value={key}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {config.icon}
                                                                <span>
                                                                    {
                                                                        config.label
                                                                    }
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    —{" "}
                                                                    {
                                                                        config.description
                                                                    }
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setInviteDialogOpen(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            inviteMutation.mutate({
                                                email: inviteEmail,
                                                role: inviteRole,
                                            })
                                        }
                                        disabled={
                                            !inviteEmail ||
                                            inviteMutation.isPending
                                        }
                                    >
                                        {inviteMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Mail className="h-4 w-4 mr-2" />
                                        )}
                                        Send Invite
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Members List */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Members
                    </h4>
                    <div className="rounded-lg border border-border overflow-hidden">
                        {isMembersLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            members?.map(
                                (
                                    member: {
                                        userId: string;
                                        role: string;
                                        id: string;
                                        name: string;
                                        email: string;
                                        imageUrl?: string;
                                    },
                                    index: number
                                ) => {
                                    const roleConfig =
                                        ROLE_CONFIG[member.role] ||
                                        ROLE_CONFIG.VIEWER;
                                    return (
                                        <div
                                            key={member.id}
                                            className={`flex items-center justify-between p-3 ${index !== 0
                                                ? "border-t border-border"
                                                : ""
                                                } hover:bg-muted/30 transition-colors`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {member.imageUrl ? (
                                                    <Image
                                                        src={member.imageUrl}
                                                        alt={member.name}
                                                        width={32}
                                                        height={32}
                                                        className="h-8 w-8 rounded-full border border-border"
                                                    />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-xs font-medium text-primary uppercase">
                                                            {member.name.slice(0, 2)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium leading-none mb-1">
                                                        {member.name}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground leading-none mb-1">
                                                        {member.email}
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] h-4 py-0 ${roleConfig.color}`}
                                                    >
                                                        {roleConfig.icon}
                                                        <span className="ml-1">
                                                            {roleConfig.label}
                                                        </span>
                                                    </Badge>
                                                </div>
                                            </div>

                                            {isAdmin &&
                                                member.role !== "ADMIN" && (
                                                    <div className="flex items-center gap-2">
                                                        <Select
                                                            value={member.role}
                                                            onValueChange={(
                                                                newRole
                                                            ) =>
                                                                roleMutation.mutate(
                                                                    {
                                                                        userId: member.userId,
                                                                        role: newRole,
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8 w-[110px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="EDITOR">
                                                                    Editor
                                                                </SelectItem>
                                                                <SelectItem value="VIEWER">
                                                                    Viewer
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        <MemberPermissionsDialog 
                                                            workspaceId={workspace.id}
                                                            memberUserId={member.userId}
                                                            memberName={member.name}
                                                        />

                                                        <AlertDialog>
                                                            <AlertDialogTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-all duration-200"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="w-[95vw] max-w-[400px] rounded-3xl border-destructive/20 bg-gradient-to-b from-background to-destructive/5 backdrop-blur-xl shadow-2xl p-6">
                                                                <AlertDialogHeader className="space-y-4">
                                                                    <AlertDialogTitle className="text-destructive flex items-center gap-3 text-xl font-bold uppercase tracking-tight">
                                                                        <div className="p-2 bg-destructive/10 rounded-xl">
                                                                            <UserPlus className="h-5 w-5 rotate-45" />
                                                                        </div>
                                                                        Remove Member?
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-foreground/70 text-sm leading-relaxed bg-destructive/5 p-4 rounded-xl border border-destructive/10">
                                                                        Are you sure you want to remove <strong className="text-foreground">{member.name}</strong>? They will immediately lose access to all shared transactions and budgets in this workspace.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter className="flex-row gap-3 pt-6">
                                                                    <AlertDialogCancel className="flex-1 rounded-2xl h-11 border-muted-foreground/20">Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        className="flex-1 bg-destructive hover:bg-destructive/90 text-white rounded-2xl h-11 font-bold shadow-lg shadow-destructive/20 transition-all duration-200"
                                                                        onClick={() =>
                                                                            removeMutation.mutate(
                                                                                member.userId
                                                                            )
                                                                        }
                                                                        disabled={removeMutation.isPending}
                                                                    >
                                                                        {removeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove Member"}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                )}
                                        </div>
                                    );
                                }
                            )
                        )}
                    </div>
                </div>

                {/* Pending Invites */}
                {isAdmin && invites && invites.length > 0 && (
                    <div className="space-y-2">
                        <Separator />
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 pt-2">
                            <Clock className="h-4 w-4" />
                            Pending Invites
                        </h4>
                        <div className="rounded-lg border border-border overflow-hidden">
                            {invites.map(
                                (
                                    invite: {
                                        id: string;
                                        email: string;
                                        role: string;
                                        token: string;
                                        expiresAt: Date;
                                    },
                                    index: number
                                ) => (
                                    <div
                                        key={invite.id}
                                        className={`flex items-center justify-between p-3 ${index !== 0
                                            ? "border-t border-border"
                                            : ""
                                            } hover:bg-muted/30 transition-colors`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {invite.email}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        ROLE_CONFIG[invite.role]
                                                            ?.label
                                                    }{" "}
                                                    • Expires{" "}
                                                    {new Date(
                                                        invite.expiresAt
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    handleCopyLink(
                                                        invite.token
                                                    )
                                                }
                                            >
                                                {copiedLink ===
                                                    invite.token ? (
                                                    <Check className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    revokeInviteMutation.mutate(
                                                        invite.id
                                                    )
                                                }
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
