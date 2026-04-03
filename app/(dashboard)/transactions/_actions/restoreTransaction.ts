"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";
import { GetFormatterForCurrency } from "@/lib/helper";

export async function RestoreTransaction(id: string) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	const workspaceId = workspace?.id;

	if (!workspace || !workspaceId) {
		throw new Error("No active workspace found");
	}

	if (workspace.role === "VIEWER") {
		throw new Error(
			"You do not have permission to restore transactions in this workspace",
		);
	}

	// We need to bypass the soft-delete filter to find the transaction
	const transaction = await prisma.transaction.findFirst({
		where: {
			userId: user.id,
			id,
			deletedAt: { not: null },
		},
	});

	if (!transaction) {
		throw new Error("Transaction not found or not deleted");
	}

	if (transaction.workspaceId && transaction.workspaceId !== workspaceId) {
		throw new Error("Transaction does not belong to this workspace");
	}

	await prisma.$transaction(async (tx) => {
		// 1. Restore the transaction (by setting deletedAt to null)
		await tx.transaction.update({
			where: {
				id,
				userId: user.id,
			},
			data: {
				deletedAt: null,
			},
		});

		// 2. Increment monthly history
		await tx.monthlyHistory.update({
			where: {
				day_month_year_userId: {
					userId: user.id,
					day: transaction.date.getUTCDate(),
					month: transaction.date.getUTCMonth(),
					year: transaction.date.getUTCFullYear(),
				},
			},
			data: {
				...(transaction.type === "expense" && {
					expense: {
						increment: transaction.amount,
					},
				}),
				...(transaction.type === "income" && {
					income: {
						increment: transaction.amount,
					},
				}),
				...(transaction.type === "investment" && {
					investment: {
						increment: transaction.amount,
					},
				}),
			},
		});

		// 3. Increment year history
		await tx.yearHistory.update({
			where: {
				month_year_userId: {
					userId: user.id,
					month: transaction.date.getUTCMonth(),
					year: transaction.date.getUTCFullYear(),
				},
			},
			data: {
				...(transaction.type === "expense" && {
					expense: {
						increment: transaction.amount,
					},
				}),
				...(transaction.type === "income" && {
					income: {
						increment: transaction.amount,
					},
				}),
				...(transaction.type === "investment" && {
					investment: {
						increment: transaction.amount,
					},
				}),
			},
		});
	});

	const formatter = GetFormatterForCurrency(workspace.currency);
	const formattedAmount = formatter.format(transaction.amount);

	await logActivity({
		workspaceId: workspaceId,
		userId: user.id,
		type: "TRANSACTION_RESTORED",
		description: `Restored ${transaction.type} transaction: ${transaction.description || transaction.category} (${formattedAmount})`,
		metadata: {
			amount: transaction.amount,
			type: transaction.type,
			category: transaction.category,
		},
	});
}
