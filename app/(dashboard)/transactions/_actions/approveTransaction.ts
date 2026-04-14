"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";
import { revalidatePath } from "next/cache";

export async function ApproveTransaction(id: string) {
	const user = await currentUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	const workspace = await getActiveWorkspace();
	if (!workspace || workspace.role !== "ADMIN") {
		throw new Error("Only admins can approve transactions");
	}

	const transaction = await prisma.transaction.findUnique({
		where: { id },
	});

	if (!transaction) {
		throw new Error("Transaction not found");
	}

	if (transaction.status !== "PENDING") {
		throw new Error("Transaction is not pending approval");
	}

	const { amount, type, date, userId, workspaceId } = transaction;

	await prisma.$transaction(async (tx) => {
		// 1. Update status
		await tx.transaction.update({
			where: { id },
			data: { status: "APPROVED" },
		});

		// 2. Update aggregates
		await tx.monthlyHistory.upsert({
			where: {
				day_month_year_userId: {
					userId,
					day: date.getUTCDate(),
					month: date.getUTCMonth(),
					year: date.getUTCFullYear(),
				},
			},
			create: {
				userId,
				workspaceId,
				day: date.getUTCDate(),
				month: date.getUTCMonth(),
				year: date.getUTCFullYear(),
				expense: type === "expense" ? amount : 0,
				income: type === "income" ? amount : 0,
				investment: type === "investment" ? amount : 0,
			},
			update: {
				workspaceId,
				expense: { increment: type === "expense" ? amount : 0 },
				income: { increment: type === "income" ? amount : 0 },
				investment: { increment: type === "investment" ? amount : 0 },
			},
		});

		await tx.yearHistory.upsert({
			where: {
				month_year_userId: {
					userId,
					month: date.getUTCMonth(),
					year: date.getUTCFullYear(),
				},
			},
			create: {
				userId,
				workspaceId,
				month: date.getUTCMonth(),
				year: date.getUTCFullYear(),
				expense: type === "expense" ? amount : 0,
				income: type === "income" ? amount : 0,
				investment: type === "investment" ? amount : 0,
			},
			update: {
				workspaceId,
				expense: { increment: type === "expense" ? amount : 0 },
				income: { increment: type === "income" ? amount : 0 },
				investment: { increment: type === "investment" ? amount : 0 },
			},
		});
	});

	const userName = user.firstName
		? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
		: user.emailAddresses[0].emailAddress.split("@")[0];

	await logActivity({
		workspaceId: workspace.id,
		userId: user.id,
		type: "TRANSACTION_APPROVED",
		description: `${userName} approved a transaction of ${amount}`,
		metadata: { transactionId: id, amount, type },
	});

	revalidatePath("/transactions");
	revalidatePath("/dashboard");

	return { success: true };
}
