"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";
import { revalidatePath } from "next/cache";

export async function RejectTransaction(id: string, reason?: string) {
	const user = await currentUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	const workspace = await getActiveWorkspace();
	if (!workspace || workspace.role !== "ADMIN") {
		throw new Error("Only admins can reject transactions");
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

	await prisma.transaction.update({
		where: { id },
		data: { status: "REJECTED" },
	});

	const userName = user.firstName
		? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
		: user.emailAddresses[0].emailAddress.split("@")[0];

	await logActivity({
		workspaceId: workspace.id,
		userId: user.id,
		type: "TRANSACTION_REJECTED",
		description: `${userName} rejected a transaction of ${transaction.amount}${reason ? `: ${reason}` : ""}`,
		metadata: { transactionId: id, amount: transaction.amount, reason },
	});

	revalidatePath("/transactions");
	revalidatePath("/dashboard");

	return { success: true };
}
