import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateStreak, checkAchievements } from "@/lib/gamification";

const ImportTransactionSchema = z.object({
	date: z.string().or(z.date()),
	amount: z.number(),
	description: z.string().min(1),
	type: z.enum(["income", "expense"]).optional().default("expense"),
	category: z.string().optional(),
	categoryIcon: z.string().optional(),
	notes: z.string().optional(),
});

const ImportRequestSchema = z.object({
	transactions: z.array(ImportTransactionSchema),
	skipDuplicates: z.boolean().default(true),
});

export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	try {
		const body = await request.json();
		const validation = ImportRequestSchema.safeParse(body);

		if (!validation.success) {
			return Response.json(
				{ error: "Invalid request data", details: validation.error },
				{ status: 400 },
			);
		}

		const { transactions, skipDuplicates } = validation.data;
		const results = {
			total: transactions.length,
			imported: 0,
			skipped: 0,
			failed: 0,
			errors: [] as Array<{ row: number; error: string; data: any }>,
		};

		// 1. Pre-fetch categories
		const userCategories = await prisma.category.findMany({
			where: { userId: user.id },
		});

		// key: "name:type" -> Category
		const categoryMap = new Map<string, (typeof userCategories)[0]>();
		userCategories.forEach((c) => {
			categoryMap.set(`${c.name.toLowerCase()}:${c.type}`, c);
		});

		for (let i = 0; i < transactions.length; i++) {
			const txn = transactions[i];

			try {
				const date = new Date(txn.date);
				if (isNaN(date.getTime())) {
					throw new Error("Invalid date");
				}

				// Handle amount/type
				// Ensure amount is positive for storage (type determines direction)
				const amount = Math.abs(txn.amount);
				const type = txn.type || "expense";

				// Category Logic
				// Default to "Uncategorized" if missing
				let categoryName = txn.category || "Uncategorized";
				const mapKey = `${categoryName.toLowerCase()}:${type}`;

				let category = categoryMap.get(mapKey);

				if (!category) {
					// Create new category
					// Since we process sequentially, this is safe from race conditions within this request
					const icon = txn.categoryIcon || (type === "income" ? "💰" : "📦");
					category = await prisma.category.create({
						data: {
							userId: user.id,
							name: categoryName,
							type,
							icon,
						},
					});
					categoryMap.set(mapKey, category);
				}

				// Duplicate Check
				if (skipDuplicates) {
					const duplicate = await prisma.transaction.findFirst({
						where: {
							userId: user.id,
							date: {
								equals: date,
							},
							amount: amount,
							description: txn.description,
							type: type,
						},
					});
					if (duplicate) {
						results.skipped++;
						continue;
					}
				}

				// Create Transaction & Aggregates in a transaction
				await prisma.$transaction(async (tx) => {
					await tx.transaction.create({
						data: {
							userId: user.id,
							date,
							amount: amount,
							description: txn.description,
							type,
							category: category!.name,
							categoryIcon: category!.icon,
							notes: txn.notes,
						},
					});

					// Update Monthly History
					await tx.monthlyHistory.upsert({
						where: {
							day_month_year_userId: {
								userId: user.id,
								day: date.getUTCDate(),
								month: date.getUTCMonth(),
								year: date.getUTCFullYear(),
							},
						},
						create: {
							userId: user.id,
							day: date.getUTCDate(),
							month: date.getUTCMonth(),
							year: date.getUTCFullYear(),
							income: type === "income" ? amount : 0,
							expense: type === "expense" ? amount : 0,
						},
						update: {
							income: { increment: type === "income" ? amount : 0 },
							expense: { increment: type === "expense" ? amount : 0 },
						},
					});

					// Update Year History
					await tx.yearHistory.upsert({
						where: {
							month_year_userId: {
								userId: user.id,
								month: date.getUTCMonth(),
								year: date.getUTCFullYear(),
							},
						},
						create: {
							userId: user.id,
							month: date.getUTCMonth(),
							year: date.getUTCFullYear(),
							income: type === "income" ? amount : 0,
							expense: type === "expense" ? amount : 0,
						},
						update: {
							income: { increment: type === "income" ? amount : 0 },
							expense: { increment: type === "expense" ? amount : 0 },
						},
					});
				});

				results.imported++;
			} catch (error) {
				results.failed++;
				results.errors.push({
					row: i + 1,
					error: error instanceof Error ? error.message : "Unknown error",
					data: txn,
				});
			}
		}

		// Trigger Gamification updates
		try {
			await updateStreak(user.id);
			await checkAchievements(user.id, { type: "transaction" });
		} catch (e) {
			console.error("Gamification update failed", e);
		}

		return Response.json(results);
	} catch (error) {
		console.error("Import error:", error);
		return Response.json(
			{ error: "Failed to import transactions" },
			{ status: 500 },
		);
	}
}
