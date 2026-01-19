"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function BulkUpdateTransactionsTags(
	ids: string[],
	tagIds: string[],
	operation: "ADD" | "REMOVE" | "REPLACE",
) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	// Verify ownership of all transactions first
	const transactions = await prisma.transaction.findMany({
		where: {
			id: { in: ids },
			userId: user.id,
		},
		select: { id: true },
	});

	if (transactions.length !== ids.length) {
		throw new Error("One or more transactions not found or unauthorized");
	}

	await prisma.$transaction(async (tx) => {
		if (operation === "REPLACE") {
			// Clear all existing tags for these transactions
			await tx.transactionTag.deleteMany({
				where: {
					transactionId: { in: ids },
				},
			});

			// Add new tags
			for (const transactionId of ids) {
				if (tagIds.length > 0) {
					await tx.transactionTag.createMany({
						data: tagIds.map((tagId) => ({
							transactionId,
							tagId,
						})),
					});
				}
			}
		} else if (operation === "ADD") {
			for (const transactionId of ids) {
				if (tagIds.length > 0) {
					await tx.transactionTag.createMany({
						data: tagIds.map((tagId) => ({
							transactionId,
							tagId,
						})),
						skipDuplicates: true,
					});
				}
			}
		} else if (operation === "REMOVE") {
			await tx.transactionTag.deleteMany({
				where: {
					transactionId: { in: ids },
					tagId: { in: tagIds },
				},
			});
		}
	});
}
