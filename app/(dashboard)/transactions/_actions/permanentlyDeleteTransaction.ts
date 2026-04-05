"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";
import { GetFormatterForCurrency } from "@/lib/helper";

export async function PermanentlyDeleteTransaction(id: string) {
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
		throw new Error("Transaction not found");
	}

	// Ensure the transaction belongs to the active workspace
	if (!transaction.workspaceId || transaction.workspaceId !== workspaceId) {
		throw new Error("Transaction does not belong to this workspace");
	}

	// Permenantly delete the transaction
    // History was already decremented during soft-delete, so we only need to remove the record
	await prisma.transaction.delete({
		where: {
			id,
		},
	});

	const formatter = GetFormatterForCurrency(workspace.currency);
	const formattedAmount = formatter.format(transaction.amount);

	await logActivity({
		workspaceId: workspaceId,
		userId: user.id,
		type: "TRANSACTION_PERMANENTLY_DELETED",
		description: `Permanently deleted ${transaction.type} transaction: ${transaction.description || transaction.category} (${formattedAmount})`,
		metadata: {
			amount: transaction.amount,
			type: transaction.type,
			category: transaction.category,
		},
	});
}
