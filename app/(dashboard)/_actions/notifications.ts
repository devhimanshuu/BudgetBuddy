"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function getNotifications(workspaceId: string) {
	const user = await currentUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	return await prisma.notification.findMany({
		where: {
			userId: user.id,
			workspaceId,
		},
		include: {
			activity: true,
		},
		orderBy: {
			createdAt: "desc",
		},
		take: 20,
	});
}

export async function getUnreadCount(workspaceId: string) {
	const user = await currentUser();
	if (!user) {
		return 0;
	}

	return await prisma.notification.count({
		where: {
			userId: user.id,
			workspaceId,
			isRead: false,
		},
	});
}

export async function markAsRead(notificationId: string) {
	const user = await currentUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	await prisma.notification.update({
		where: {
			id: notificationId,
			userId: user.id,
		},
		data: {
			isRead: true,
		},
	});

	// Note: We don't necessarily need to revalidatePath here if we handle state locally or via TanStack Query
}

export async function markAllAsRead(workspaceId: string) {
	const user = await currentUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	await prisma.notification.updateMany({
		where: {
			userId: user.id,
			workspaceId,
			isRead: false,
		},
		data: {
			isRead: true,
		},
	});
}
