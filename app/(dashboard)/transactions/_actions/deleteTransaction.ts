"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";

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
			userId: user.id,
			id,
		},
	});

	if (!transaction) {
		throw new Error("bad request");
	}

	if (transaction.workspaceId && transaction.workspaceId !== workspaceId) {
		throw new Error("Transaction does not belong to this workspace");
	}

	await prisma.$transaction([
		prisma.transaction.delete({
			where: {
				id,
				userId: user.id,
			},
		}),
		prisma.monthlyHistory.update({
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
						decrement: transaction.amount,
					},
				}),
				...(transaction.type === "income" && {
					income: {
						decrement: transaction.amount,
					},
				}),
			},
		}),

		prisma.yearHistory.update({
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
						decrement: transaction.amount,
					},
				}),
				...(transaction.type === "income" && {
					income: {
						decrement: transaction.amount,
					},
				}),
			},
		}),
	]);

	await logActivity({
		workspaceId: workspaceId,
		userId: user.id,
		type: "TRANSACTION_DELETED",
		description: `Deleted ${transaction.type} transaction: ${transaction.description || transaction.category} ($${transaction.amount})`,
		metadata: {
			amount: transaction.amount,
			type: transaction.type,
			category: transaction.category,
		},
	});
}
