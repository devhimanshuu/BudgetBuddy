import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function getActiveWorkspace() {
	const user = await currentUser();
	if (!user) return null;

	// Try to get workspaceId from cookies
	const cookieStore = await cookies(); // Note: cookies() is now async in some Next versions, or returns a promise
	const workspaceCookie = cookieStore.get("active_workspace_id")?.value;

	if (workspaceCookie) {
		// Verify user is a member of this workspace
		const membership = await prisma.workspaceMember.findUnique({
			where: {
				workspaceId_userId: {
					workspaceId: workspaceCookie,
					userId: user.id,
				},
			},
			include: {
				workspace: true,
			},
		});

		if (membership) {
			return {
				...membership.workspace,
				role: membership.role,
			};
		}
	}

	// Default to the first workspace where the user is a member
	const firstMembership = await prisma.workspaceMember.findFirst({
		where: { userId: user.id },
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
			where: { userId: user.id },
		});
		const workspace = await prisma.workspace.create({
			data: {
				name: "Personal Workspace",
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
		return { ...workspace, role: "ADMIN" };
	}

	return {
		...firstMembership.workspace,
		role: firstMembership.role,
	};
}

export async function checkPermissions(
	workspaceId: string,
	requiredRoles: string[] = ["ADMIN", "EDITOR"],
) {
	const user = await currentUser();
	if (!user) return false;

	const membership = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: {
				workspaceId,
				userId: user.id,
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
