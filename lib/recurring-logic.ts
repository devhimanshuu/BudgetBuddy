import prisma from "@/lib/prisma";
import { updateStreak, checkAchievements } from "@/lib/gamification";

type RecurringInterval = "daily" | "weekly" | "monthly" | "yearly";

export function calculateNextDate(
	currentDate: Date,
	interval: RecurringInterval,
): Date {
	const nextDate = new Date(currentDate);
	switch (interval) {
		case "daily":
			nextDate.setDate(nextDate.getDate() + 1);
			break;
		case "weekly":
			nextDate.setDate(nextDate.getDate() + 7);
			break;
		case "monthly":
			nextDate.setMonth(nextDate.getMonth() + 1);
			break;
		case "yearly":
			nextDate.setFullYear(nextDate.getFullYear() + 1);
			break;
	}
	return nextDate;
}

/**
 * Process a single recurring transaction.
 * If multiple periods have passed since last run, it creates a transaction for each period.
 * Returns the number of transactions created.
 */
export async function processRecurringTransaction(transactionId: string) {
	const recurring = await prisma.recurringTransaction.findUnique({
		where: { id: transactionId },
	});

	if (!recurring) {
		throw new Error("Recurring transaction not found");
	}

	const now = new Date();
	let currentDueDate = new Date(recurring.date);
	let transactionsCreated = 0;

	// Safety break: Limit loops to avoid infinite loops or massive DB writes
	// e.g. if a user set a daily recurring transaction 5 years ago and just logged in
	const MAX_LOOPS = 48; // Approx 1.5 months of daily, or 4 years of monthly

	while (currentDueDate <= now && transactionsCreated < MAX_LOOPS) {
		// Create Transaction
		await prisma.$transaction(async (tx) => {
			await tx.transaction.create({
				data: {
					userId: recurring.userId,
					amount: recurring.amount,
					date: currentDueDate,
					description: recurring.description,
					notes: `Recurring transaction: ${recurring.interval}`,
					type: recurring.type,
					category: recurring.category,
					categoryIcon: recurring.categoryIcon,
				},
			});

			// Update History Aggregates
			const day = currentDueDate.getUTCDate();
			const month = currentDueDate.getUTCMonth();
			const year = currentDueDate.getUTCFullYear();

			await tx.monthlyHistory.upsert({
				where: {
					day_month_year_userId: {
						userId: recurring.userId,
						day,
						month,
						year,
					},
				},
				create: {
					userId: recurring.userId,
					day,
					month,
					year,
					expense: recurring.type === "expense" ? recurring.amount : 0,
					income: recurring.type === "income" ? recurring.amount : 0,
				},
				update: {
					expense: {
						increment: recurring.type === "expense" ? recurring.amount : 0,
					},
					income: {
						increment: recurring.type === "income" ? recurring.amount : 0,
					},
				},
			});

			await tx.yearHistory.upsert({
				where: {
					month_year_userId: {
						userId: recurring.userId,
						month,
						year,
					},
				},
				create: {
					userId: recurring.userId,
					month,
					year,
					expense: recurring.type === "expense" ? recurring.amount : 0,
					income: recurring.type === "income" ? recurring.amount : 0,
				},
				update: {
					expense: {
						increment: recurring.type === "expense" ? recurring.amount : 0,
					},
					income: {
						increment: recurring.type === "income" ? recurring.amount : 0,
					},
				},
			});
		});

		// Calculate next date (for next iteration)
		currentDueDate = calculateNextDate(
			currentDueDate,
			recurring.interval as RecurringInterval,
		);
		transactionsCreated++;
	}

	// Update the recurring transaction record with the new next due date
	// Note: We update it to creating date, even if loop broke early due to limit,
	// so we don't start over from scratch next time.
	if (transactionsCreated > 0) {
		await prisma.recurringTransaction.update({
			where: { id: transactionId },
			data: {
				date: currentDueDate,
				lastProcessed: new Date(),
			},
		});

		// Trigger Gamification updates (just once per batch)
		try {
			await updateStreak(recurring.userId);
			await checkAchievements(recurring.userId, { type: "transaction" });
		} catch (e) {
			console.error("Gamification error during recurring processing", e);
		}
	}

	return transactionsCreated;
}
