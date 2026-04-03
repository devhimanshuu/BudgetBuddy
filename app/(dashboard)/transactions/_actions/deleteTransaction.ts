"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";
import { GetFormatterForCurrency } from "@/lib/helper";

export async function DeleteTransaction(id: string) {
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
			"You do not have permission to delete transactions in this workspace",
		);
	}

	const transaction = await prisma.transaction.findUnique({
		where: {
			id,
		},
	});

	if (!transaction) {
		throw new Error("bad request");
	}

	// Ensure the transaction belongs to the active workspace
	if (!transaction.workspaceId || transaction.workspaceId !== workspaceId) {
		throw new Error("Transaction does not belong to this workspace");
	}

	await prisma.$transaction(async (tx) => {
		// 1. Soft-delete: set deletedAt timestamp instead of hard delete
		await tx.transaction.update({
			where: {
				id,
			},
			data: {
				deletedAt: new Date(),
			},
		});

		// 2. Decrement monthly history
		await tx.monthlyHistory.update({
			where: {
				day_month_year_userId: {
					userId: transaction.userId,
					day: transaction.date.getUTCDate(),
					month: transaction.date.getUTCMonth(),
					year: transaction.date.getUTCFullYear(),
				},
			},
			data: {
				...(transaction.type === "expense" && {
					expense: {
						decrement: transaction.amount,
					},
				}),
				...(transaction.type === "income" && {
					income: {
						decrement: transaction.amount,
					},
				}),
				...(transaction.type === "investment" && {
					investment: {
						decrement: transaction.amount,
					},
				}),
			},
		});

		// 3. Decrement year history
		await tx.yearHistory.update({
			where: {
				month_year_userId: {
					userId: transaction.userId,
					month: transaction.date.getUTCMonth(),
					year: transaction.date.getUTCFullYear(),
				},
			},
			data: {
				...(transaction.type === "expense" && {
					expense: {
						decrement: transaction.amount,
					},
				}),
				...(transaction.type === "income" && {
					income: {
						decrement: transaction.amount,
					},
				}),
				...(transaction.type === "investment" && {
					investment: {
						decrement: transaction.amount,
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
		type: "TRANSACTION_DELETED",
		description: `Deleted ${transaction.type} transaction: ${transaction.description || transaction.category} (${formattedAmount})`,
		metadata: {
			amount: transaction.amount,
			type: transaction.type,
			category: transaction.category,
		},
	});
}
