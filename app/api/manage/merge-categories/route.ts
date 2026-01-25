import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const body = await request.json();
	const schema = z.object({
		sourceCategoryName: z.string(),
		targetCategoryName: z.string(),
		type: z.enum(["income", "expense"]),
	});

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return Response.json(parsed.error, { status: 400 });
	}

	const { sourceCategoryName, targetCategoryName, type } = parsed.data;

	if (sourceCategoryName === targetCategoryName) {
		return Response.json(
			{ error: "Source and target categories must be different" },
			{ status: 400 },
		);
	}

	try {
		const result = await prisma.$transaction(async (tx) => {
			// 1. Check if both categories exist
			const sourceCategory = await tx.category.findUnique({
				where: {
					name_userId_type: {
						name: sourceCategoryName,
						userId: user.id,
						type,
					},
				},
			});

			const targetCategory = await tx.category.findUnique({
				where: {
					name_userId_type: {
						name: targetCategoryName,
						userId: user.id,
						type,
					},
				},
			});

			if (!sourceCategory || !targetCategory) {
				throw new Error("One or both categories not found");
			}

			// 2. Update all transactions from source to target
			const updatedTransactions = await tx.transaction.updateMany({
				where: {
					userId: user.id,
					category: sourceCategoryName,
					type,
				},
				data: {
					category: targetCategoryName,
					categoryIcon: targetCategory.icon,
				},
			});

			// 3. Update all transaction splits from source to target
			// We need to find transactions belonging to this user that have splits with the source category
			// Since TransactionSplit doesn't have userId, we filter by transaction.userId
			await tx.transactionSplit.updateMany({
				where: {
					category: sourceCategoryName,
					transaction: {
						userId: user.id,
					},
				},
				data: {
					category: targetCategoryName,
					categoryIcon: targetCategory.icon,
				},
			});

			// 4. Update all transaction history entries
			await tx.transactionHistory.updateMany({
				where: {
					category: sourceCategoryName,
					type,
					transaction: {
						userId: user.id,
					},
				},
				data: {
					category: targetCategoryName,
					categoryIcon: targetCategory.icon,
				},
			});

			// 5. Delete the source category
			await tx.category.delete({
				where: {
					name_userId_type: {
						name: sourceCategoryName,
						userId: user.id,
						type,
					},
				},
			});

			return {
				count: updatedTransactions.count,
				source: sourceCategoryName,
				target: targetCategoryName,
			};
		});

		return Response.json({
			message: `Successfully merged ${result.source} into ${result.target}. ${result.count} transactions updated.`,
			count: result.count,
		});
	} catch (error: any) {
		console.error("Merge error:", error);
		return Response.json(
			{ error: error.message || "Failed to merge categories" },
			{ status: 500 },
		);
	}
}
