import prisma from "@/lib/prisma";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function getActiveWorkspace(userId: string) {
	if (!userId) return null;

	// Try to get workspaceId from cookies
	const cookieStore = await cookies(); // Note: cookies() is now async in some Next versions, or returns a promise
	const workspaceCookie = cookieStore.get("active_workspace_id")?.value;

	if (workspaceCookie) {
		// Verify user is a member of this workspace
		const membership = await prisma.workspaceMember.findUnique({
			where: {
				workspaceId_userId: {
					workspaceId: workspaceCookie,
				userId: userId,
				},
			},
			include: {
				workspace: true,
			},
		});

		if (membership) {
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
		where: { userId: userId },
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
			where: { userId: userId },
		});
		const workspace = await prisma.workspace.create({
			data: {
				name: "Personal Workspace",
				ownerId: userId,
				currency: settings?.currency || "USD",
				members: {
					create: {
					userId: userId,
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

	const membership = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: {
				workspaceId,
				userId: userId,
			},
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
