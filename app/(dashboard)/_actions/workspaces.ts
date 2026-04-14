"use server";

import prisma from "@/lib/prisma";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import {
	getActiveWorkspace,
	checkPermissions,
	logActivity,
} from "@/lib/workspaces";
import { sendInviteEmail } from "@/lib/mail";

export async function GetWorkspaces() {
	const user = await currentUser();
	if (!user) return [];

	const memberships = await prisma.workspaceMember.findMany({
		where: { 
			userId: user.id,
			deletedAt: null,
			workspace: {
				deletedAt: null,
			},
		},
		include: {
			workspace: true,
		},
	});

	// Get clerk client to fetch owner names for shared workspaces
	const client = await clerkClient();

	// Find unique owner IDs for workspaces where the user is not the owner
	// and the workspace has a generic name or needs owner identification
	const otherOwnerIds = Array.from(
		new Set(
			memberships
				.filter((m) => m.workspace.ownerId !== user.id)
				.map((m) => m.workspace.ownerId),
		),
	);

	const owners =
		otherOwnerIds.length > 0
			? await client.users.getUserList({ userId: otherOwnerIds })
			: { data: [] };

	const ownerMap = new Map();
	owners.data.forEach((u) => {
		const name = u.firstName
			? u.lastName
				? `${u.firstName} ${u.lastName}`
				: u.firstName
			: (u.emailAddresses[0]?.emailAddress.split("@")[0] || "Member");
		ownerMap.set(u.id, name);
	});

	return memberships.map((m) => {
		let name = m.workspace.name;

		// If it's a shared workspace and the name is generic, or if the user specifically
		// requested "Inviter's Workspace" style for shared ones
		if (m.userId !== m.workspace.ownerId && name === "Personal Workspace") {
			const ownerName = ownerMap.get(m.workspace.ownerId) || "Admin";
			name = `${ownerName}'s Workspace`;
		}

		return {
			...m.workspace,
			name,
			role: m.role,
		};
	});
}

export async function GetActiveWorkspace() {
	const user = await currentUser();
	return await getActiveWorkspace(user?.id);
}

export async function SwitchWorkspace(workspaceId: string) {
	const user = await currentUser();
	if (!user) throw new Error("Unauthorized");

	const membership = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: {
				workspaceId,
				userId: user.id,
			},
		},
	});

	if (!membership) throw new Error("Unauthorized");

	const cookieStore = await cookies();
	cookieStore.set("active_workspace_id", workspaceId, {
		path: "/",
		maxAge: 60 * 60 * 24 * 30, // 30 days
	});

	revalidatePath("/");
	return { success: true };
}

export async function CreateWorkspace(name: string) {
	const user = await currentUser();
	if (!user) throw new Error("Unauthorized");

	const settings = await prisma.userSettings.findUnique({
		where: { userId: user.id },
	});

	const userName = user.firstName
		? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
		: user.emailAddresses[0].emailAddress.split("@")[0];

	const workspace = await prisma.workspace.create({
		data: {
			name,
			ownerId: user.id,
			currency: settings?.currency || "USD",
			members: {
				create: {
					userId: user.id,
					role: "ADMIN",
				},
			},
		},
	});

	await logActivity({
		workspaceId: workspace.id,
		userId: user.id,
		type: "WORKSPACE_CREATED",
		description: `${userName} created workspace: ${name}`,
		metadata: { userName },
	});

	return workspace;
}

export async function GetWorkspaceMembers(workspaceId: string) {
	const user = await currentUser();
	if (!user) return [];

	// Verify the current user is a member of this workspace
	const membership = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: {
				workspaceId,
				userId: user.id,
			},
		},
	});

	if (!membership) return [];

	const members = await prisma.workspaceMember.findMany({
		where: { workspaceId },
		orderBy: { createdAt: "asc" },
	});

	// Enrich with Clerk data
	const client = await clerkClient();
	const userIds = members.map((m) => m.userId);
	const clerkUsers = await client.users.getUserList({ userId: userIds });

	return members.map((m) => {
		const clerkUser = clerkUsers.data.find((u) => u.id === m.userId);
		return {
			...m,
			name: clerkUser
				? clerkUser.firstName
					? clerkUser.lastName
						? `${clerkUser.firstName} ${clerkUser.lastName}`
						: clerkUser.firstName
					: clerkUser.emailAddresses[0]?.emailAddress.split("@")[0]
				: "Unknown User",
			email: clerkUser?.emailAddresses[0]?.emailAddress || "No email",
			imageUrl: clerkUser?.imageUrl,
		};
	});
}

export async function GetPendingInvites(workspaceId: string) {
	const user = await currentUser();
	if (!user) return [];

	const canInvite = await checkPermissions(workspaceId, user.id, ["ADMIN"]);
	if (!canInvite) return [];

	const invites = await prisma.invite.findMany({
		where: {
			workspaceId,
			expiresAt: { gt: new Date() },
			NOT: {
				email: { startsWith: "qr-invite:" },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return invites;
}

export async function InviteMember(
	workspaceId: string,
	email: string,
	role: string = "VIEWER",
) {
	const user = await currentUser();
	if (!user) throw new Error("Unauthorized");

	const canInvite = await checkPermissions(workspaceId, user.id, ["ADMIN"]);
	if (!canInvite) throw new Error("Only admins can invite members");

	// Check if an active invite already exists for this email
	const existingInvite = await prisma.invite.findFirst({
		where: {
			workspaceId,
			email,
			expiresAt: { gt: new Date() },
		},
	});

	if (existingInvite) {
		throw new Error("An invite for this email already exists");
	}

	const token = randomUUID();
	const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

	const invite = await prisma.invite.create({
		data: {
			email,
			workspaceId,
			role,
			token,
			expiresAt,
		},
	});

	// Send email via SendGrid
	const getAppUrl = () => {
		if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
		if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
			return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
		if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
		return "http://localhost:3000";
	};

	const inviteLink = `${getAppUrl()}/join?token=${token}`;

	// Get workspace details for the email
	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
	});
	const inviterName = user.firstName
		? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
		: user.emailAddresses?.[0]?.emailAddress || "Someone";

	try {
		await sendInviteEmail({
			to: email,
			inviterName,
			workspaceName: workspace?.name || "Budget Workspace",
			role,
			inviteLink,
		});
	} catch (emailError) {
		console.error(
			"Email send failed, but invite was still created:",
			emailError,
		);
		// Don't throw — the invite is still valid, just copy the link manually
	}

	revalidatePath("/manage");

	const userName = user.firstName
		? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
		: user.emailAddresses[0].emailAddress.split("@")[0];

	await logActivity({
		workspaceId,
		userId: user.id,
		type: "MEMBER_INVITED",
		description: `${userName} invited ${email} as ${role}`,
		metadata: { email, role, userName },
	});

	return { success: true, inviteLink, token };
}

export async function GetOrCreateQRInvite(workspaceId: string, role: string = "VIEWER") {
	const user = await currentUser();
	if (!user) throw new Error("Unauthorized");

	const canInvite = await checkPermissions(workspaceId, user.id, ["ADMIN"]);
	if (!canInvite) throw new Error("Only admins can generate join QR codes");

	const placeholderEmail = `qr-invite:${workspaceId}`;

	// Check if a valid QR invite already exists
	let invite = await prisma.invite.findFirst({
		where: {
			workspaceId,
			email: placeholderEmail,
			role,
			expiresAt: { gt: new Date() },
			deletedAt: null,
		},
	});

	if (!invite) {
		const token = randomUUID();
		// QR invites last longer, say 24 hours, or until revoked
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

		invite = await prisma.invite.create({
			data: {
				email: placeholderEmail,
				workspaceId,
				role,
				token,
				expiresAt,
			},
		});

		const userName = user.firstName
			? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
			: user.emailAddresses[0].emailAddress.split("@")[0];

		await logActivity({
			workspaceId,
			userId: user.id,
			type: "QR_CODE_GENERATED",
			description: `${userName} generated a join QR code for ${role} access`,
			metadata: { role, userName },
		});
	}

	const getAppUrl = () => {
		if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
		if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
			return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
		if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
		return "http://localhost:3000";
	};

	const inviteLink = `${getAppUrl()}/join?token=${invite.token}`;

	return {
		success: true,
		inviteLink,
		token: invite.token,
		expiresAt: invite.expiresAt,
	};
}

export async function AcceptInvite(token: string) {
	const user = await currentUser();
	if (!user) throw new Error("You must be signed in to accept an invite");

	const invite = await prisma.invite.findUnique({
		where: { token },
		include: { workspace: true },
	});

	if (!invite) throw new Error("Invalid invite link");
	if (invite.expiresAt < new Date()) throw new Error("This invite has expired");

	// Check if already a member
	const existingMember = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: {
				workspaceId: invite.workspaceId,
				userId: user.id,
			},
		},
	});

	if (existingMember) {
		// Already a member, delete the invite and return
		await prisma.invite.update({ where: { id: invite.id }, data: { deletedAt: new Date() } });
		return {
			success: true,
			workspaceId: invite.workspaceId,
			alreadyMember: true,
		};
	}

	// Create membership and delete invite in a transaction
	await prisma.$transaction(async (tx) => {
		await tx.workspaceMember.create({
			data: {
				workspaceId: invite.workspaceId,
				userId: user.id,
				role: invite.role,
			},
		});
		
		// Only delete if it's NOT a reusable QR invite
		if (!invite.email.startsWith("qr-invite:")) {
			await tx.invite.update({ where: { id: invite.id }, data: { deletedAt: new Date() } });
		}
	});

	const userName = user.firstName
		? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
		: user.emailAddresses[0].emailAddress.split("@")[0];

	await logActivity({
		workspaceId: invite.workspaceId,
		userId: user.id,
		type: "MEMBER_JOINED",
		description: `${userName} joined the workspace via invite`,
		metadata: { userName },
	});

	const cookieStore = await cookies();
	cookieStore.set("active_workspace_id", invite.workspaceId, {
		path: "/",
		maxAge: 60 * 60 * 24 * 30, // 30 days
	});

	revalidatePath("/");
	return {
		success: true,
		workspaceId: invite.workspaceId,
		workspaceName: invite.workspace.name,
	};
}

export async function RemoveMember(workspaceId: string, memberUserId: string) {
	const user = await currentUser();
	if (!user) throw new Error("Unauthorized");

	const canManage = await checkPermissions(workspaceId, user.id, ["ADMIN"]);
	if (!canManage) throw new Error("Only admins can remove members");

	// Can't remove yourself if you're the workspace owner
	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
	});
	if (workspace?.ownerId === memberUserId) {
		throw new Error("Cannot remove the workspace owner");
	}

	await prisma.workspaceMember.update({
		where: {
			workspaceId_userId: {
				workspaceId,
				userId: memberUserId,
			},
		},
		data: { deletedAt: new Date() },
	});

	revalidatePath("/manage");

	await logActivity({
		workspaceId,
		userId: user.id,
		type: "MEMBER_REMOVED",
		description: `Removed a member from the workspace`,
		metadata: { removedUserId: memberUserId },
	});

	return { success: true };
}

export async function UpdateMemberRole(
	workspaceId: string,
	memberUserId: string,
	newRole: string,
) {
	const user = await currentUser();
	if (!user) throw new Error("Unauthorized");

	const canManage = await checkPermissions(workspaceId, user.id, ["ADMIN"]);
	if (!canManage) throw new Error("Only admins can change roles");

	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
	});
	if (workspace?.ownerId === memberUserId && newRole !== "ADMIN") {
		throw new Error("Cannot change the owner's role");
	}

	await prisma.workspaceMember.update({
		where: {
			workspaceId_userId: {
				workspaceId,
				userId: memberUserId,
			},
		},
		data: { role: newRole },
	});

	revalidatePath("/manage");

	await logActivity({
		workspaceId,
		userId: user.id,
		type: "ROLE_UPDATED",
		description: `Updated a member's role to ${newRole}`,
		metadata: { memberUserId, newRole },
	});

	return { success: true };
}

export async function RevokeInvite(inviteId: string) {
	const user = await currentUser();
	if (!user) throw new Error("Unauthorized");

	const invite = await prisma.invite.findUnique({
		where: { id: inviteId },
	});

	if (!invite) throw new Error("Invite not found");

	const canManage = await checkPermissions(invite.workspaceId, user.id, ["ADMIN"]);
	if (!canManage) throw new Error("Only admins can revoke invites");

	await prisma.invite.update({ where: { id: inviteId }, data: { deletedAt: new Date() } });

	revalidatePath("/manage");

	await logActivity({
		workspaceId: invite.workspaceId,
		userId: user.id,
		type: "INVITE_REVOKED",
		description: `Revoked invite for ${invite.email}`,
		metadata: { email: invite.email },
	});

	return { success: true };
}
export async function UpdateWorkspace(workspaceId: string, data: { name?: string; currency?: string; approvalThreshold?: number }) {
	const user = await currentUser();
	if (!user) throw new Error("Unauthorized");

	const canManage = await checkPermissions(workspaceId, user.id, ["ADMIN"]);
	if (!canManage) throw new Error("Only admins can update workspace settings");

	const updatedWorkspace = await prisma.workspace.update({
		where: { id: workspaceId },
		data,
	});

	await logActivity({
		workspaceId,
		userId: user.id,
		type: "WORKSPACE_UPDATED",
		description: `Updated workspace settings`,
		metadata: data,
	});

	revalidatePath("/manage");
	revalidatePath("/dashboard");

	return updatedWorkspace;
}

export async function DeleteWorkspace(workspaceId: string) {
	const user = await currentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
	});

	if (!workspace) throw new Error("Workspace not found");
	if (workspace.ownerId !== user.id) throw new Error("Only the workspace owner can delete it");

	// Soft delete the workspace
	await prisma.workspace.update({
		where: { id: workspaceId },
		data: { deletedAt: new Date() },
	});

	// Log activity
	await logActivity({
		workspaceId,
		userId: user.id,
		type: "WORKSPACE_DELETED",
		description: `Deleted workspace: ${workspace.name}`,
	});

	revalidatePath("/manage");
	revalidatePath("/");

	return { success: true };
}

export async function LeaveWorkspace(workspaceId: string) {
	const user = await currentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await prisma.workspace.findUnique({
		where: { id: workspaceId },
	});

	if (!workspace) throw new Error("Workspace not found");
	if (workspace.ownerId === user.id) throw new Error("Owners cannot leave their own workspace. Delete it instead.");

	// Verify membership
	const membership = await prisma.workspaceMember.findFirst({
		where: {
			workspaceId,
			userId: user.id,
			deletedAt: null,
		},
	});

	if (!membership) throw new Error("You are not a member of this workspace");

	// Soft delete the membership
	await prisma.workspaceMember.update({
		where: {
			workspaceId_userId: {
				workspaceId,
				userId: user.id,
			},
		},
		data: { deletedAt: new Date() },
	});

	// Log activity
	await logActivity({
		workspaceId,
		userId: user.id,
		type: "MEMBER_LEFT",
		description: `Left the workspace`,
	});

	revalidatePath("/manage");
	revalidatePath("/");

	return { success: true };
}
