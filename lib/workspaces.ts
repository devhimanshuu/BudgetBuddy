import prisma from "@/lib/prisma";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function getActiveWorkspace(userId?: string) {
	let finalUserId = userId;
	if (!finalUserId) {
		const user = await currentUser();
		if (!user) return null;
		finalUserId = user.id;
	}

	// Try to get workspaceId from cookies
	const cookieStore = await cookies(); // Note: cookies() is now async in some Next versions, or returns a promise
	const workspaceCookie = cookieStore.get("active_workspace_id")?.value;

	if (workspaceCookie) {
		// Verify user is a member of this workspace
		const membership = await prisma.workspaceMember.findFirst({
			where: {
				workspaceId: workspaceCookie,
				userId: finalUserId,
				deletedAt: null,
				workspace: {
					deletedAt: null,
				},
			},
			include: {
				workspace: true,
			},
		});

		if (membership && membership.workspace) {
			let name = membership.workspace.name;
			if (membership.userId !== membership.workspace.ownerId && name === "Personal Workspace") {
				try {
					const client = await clerkClient();
					const owner = await client.users.getUser(membership.workspace.ownerId);
					const ownerName = owner.firstName ? (owner.lastName ? `${owner.firstName} ${owner.lastName}` : owner.firstName) : (owner.emailAddresses[0]?.emailAddress.split("@")[0] || "Admin");
					name = `${ownerName}'s Workspace`;
				} catch (error) {
					console.error("Failed to fetch workspace owner:", error);
				}
			}
			return {
				...membership.workspace,
				name,
				role: membership.role,
			};
		}
	}

	// Default to the first workspace where the user is a member
	const firstMembership = await prisma.workspaceMember.findFirst({
		where: { 
			userId: finalUserId,
			deletedAt: null,
			workspace: {
				deletedAt: null,
			},
		},
		include: {
			workspace: true,
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	if (!firstMembership) {
		// This shouldn't happen after migration, but if it does, create a default one
		const settings = await prisma.userSettings.findUnique({
			where: { userId: finalUserId },
		});
		const workspace = await prisma.workspace.create({
			data: {
				name: "Personal Workspace",
				ownerId: finalUserId,
				currency: settings?.currency || "USD",
				members: {
					create: {
					userId: finalUserId,
						role: "ADMIN",
					},
				},
			},
		});
		return { ...workspace, role: "ADMIN" };
	}

	let name = firstMembership.workspace.name;
	if (firstMembership.userId !== firstMembership.workspace.ownerId && name === "Personal Workspace") {
		try {
			const client = await clerkClient();
			const owner = await client.users.getUser(firstMembership.workspace.ownerId);
			const ownerName = owner.firstName ? (owner.lastName ? `${owner.firstName} ${owner.lastName}` : owner.firstName) : (owner.emailAddresses[0]?.emailAddress.split("@")[0] || "Admin");
			name = `${ownerName}'s Workspace`;
		} catch (error) {
			console.error("Failed to fetch workspace owner:", error);
		}
	}

	return {
		...firstMembership.workspace,
		name,
		role: firstMembership.role,
	};
}

export async function checkPermissions(
	workspaceId: string,
	userId: string,
	requiredRoles: string[] = ["ADMIN", "EDITOR"],
) {
	if (!userId) return false;

	const membership = await prisma.workspaceMember.findFirst({
		where: {
			workspaceId,
			userId: userId,
			deletedAt: null,
		},
	});

	if (!membership) return false;
	return requiredRoles.includes(membership.role);
}

export async function logActivity({
	workspaceId,
	userId,
	type,
	description,
	metadata,
}: {
	workspaceId: string;
	userId: string;
	type: string;
	description: string;
	metadata?: any;
}) {
	try {
		await prisma.activity.create({
			data: {
				workspaceId,
				userId,
				type,
				description,
				metadata,
			},
		});
	} catch (error) {
		console.error("Failed to log activity:", error);
	}
}

export async function getMemberRestrictions(userId: string, workspaceId: string) {
	const membership = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: {
				workspaceId,
				userId,
			},
		},
		include: {
			memberRestrictions: true,
		},
	});

	if (!membership || membership.role === "ADMIN") return null; // Admins have no restrictions

	const categoryRestrictions = membership.memberRestrictions
		.filter((r) => r.resourceType === "CATEGORY")
		.map((r) => r.resourceId);

	const assetRestrictions = membership.memberRestrictions
		.filter((r) => r.resourceType === "ASSET")
		.map((r) => r.resourceId);

	return {
		allowedCategories: categoryRestrictions.length > 0 ? categoryRestrictions : null,
		allowedAssets: assetRestrictions.length > 0 ? assetRestrictions : null,
	};
}
