"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
	processRecurringTransaction,
	calculateNextDate,
} from "@/lib/recurring-logic";

export async function EditRecurringTransaction(
	id: string,
	form: CreateRecurringTransactionSchemaType,
) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { amount, category, date, description, interval, type } = form;

	const categoryRow = await prisma.category.findFirst({
		where: {
			userId: user.id,
			name: category,
		},
	});

	if (!categoryRow) {
		throw new Error("category not found");
	}

	// Verify ownership and existence
	const existing = await prisma.recurringTransaction.findUnique({
		where: { id, userId: user.id },
	});

	if (!existing) {
		throw new Error("Recurring transaction not found");
	}

	await prisma.recurringTransaction.update({
		where: {
			id,
			userId: user.id,
		},
		data: {
			amount,
			date,
			description: description || "",
			interval,
			type,
			category: categoryRow.name,
			categoryIcon: categoryRow.icon,
		},
	});

	revalidatePath("/transactions");
}

export type RecurringInterval = "daily" | "weekly" | "monthly" | "yearly";

export interface CreateRecurringTransactionSchemaType {
	amount: number;
	description: string;
	category: string;
	date: Date; // Start date/Next due date
	interval: RecurringInterval;
	type: "income" | "expense";
}

export async function CreateRecurringTransaction(
	form: CreateRecurringTransactionSchemaType,
) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { amount, category, date, description, interval, type } = form;

	const categoryRow = await prisma.category.findFirst({
		where: {
			userId: user.id,
			name: category,
		},
	});

	if (!categoryRow) {
		throw new Error("category not found");
	}

	await prisma.recurringTransaction.create({
		data: {
			userId: user.id,
			amount,
			date,
			description: description || "",
			interval,
			type,
			category: categoryRow.name,
			categoryIcon: categoryRow.icon,
		},
	});

	revalidatePath("/transactions");
}

export async function GetRecurringTransactions() {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	return await prisma.recurringTransaction.findMany({
		where: {
			userId: user.id,
		},
		orderBy: {
			date: "asc",
		},
	});
}

export async function DeleteRecurringTransaction(id: string) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	await prisma.recurringTransaction.delete({
		where: {
			id,
			userId: user.id,
		},
	});

	revalidatePath("/transactions");
}

export async function GetDueRecurringTransactions() {
	const user = await currentUser();
	if (!user) {
		throw new Error("User not authenticated");
	}

	const now = new Date();
	// Find transactions where next due date is today or in the past
	// AND that haven't been processed today (though logic mainly relies on 'date' being updated)

	return await prisma.recurringTransaction.findMany({
		where: {
			userId: user.id,
			date: {
				lte: now,
			},
		},
		orderBy: {
			date: "asc",
		},
	});
}

export async function ProcessRecurringTransaction(id: string) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const recurring = await prisma.recurringTransaction.findUnique({
		where: { id, userId: user.id },
	});

	if (!recurring) {
		throw new Error("Recurring transaction not found");
	}

	// Logic similar to CreateTransaction but simplified
	await prisma.$transaction(async (tx) => {
		// 1. Create real transaction
		await tx.transaction.create({
			data: {
				userId: user.id,
				amount: recurring.amount,
				date: recurring.date, // Use the due date as the transaction date
				description: recurring.description,
				notes: `Recurring transaction: ${recurring.interval}`,
				type: recurring.type,
				category: recurring.category,
				categoryIcon: recurring.categoryIcon,
			},
		});

		// 2. Aggregate updates (Monthly/Yearly) - COPIED logic from transaction.ts to ensure consistency
		const date = recurring.date;
		const type = recurring.type;
		const amount = recurring.amount;

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
				expense: type === "expense" ? amount : 0,
				income: type === "income" ? amount : 0,
			},
			update: {
				expense: { increment: type === "expense" ? amount : 0 },
				income: { increment: type === "income" ? amount : 0 },
			},
		});

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
				expense: type === "expense" ? amount : 0,
				income: type === "income" ? amount : 0,
			},
			update: {
				expense: { increment: type === "expense" ? amount : 0 },
				income: { increment: type === "income" ? amount : 0 },
			},
		});

		// 3. Update Recurring Transaction Next Due Date
		const nextDate = calculateNextDate(
			recurring.date,
			recurring.interval as RecurringInterval,
		);

		await tx.recurringTransaction.update({
			where: { id },
			data: {
				date: nextDate,
				lastProcessed: new Date(),
			},
		});
	});

	revalidatePath("/");
	revalidatePath("/transactions");
}

export async function ProcessAllDueRecurringTransactions() {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const now = new Date();
	const due = await prisma.recurringTransaction.findMany({
		where: {
			userId: user.id,
			date: {
				lte: now,
			},
		},
	});

	if (due.length === 0) return;

	for (const transaction of due) {
		await processRecurringTransaction(transaction.id);
	}

	revalidatePath("/");
	revalidatePath("/transactions");
}

export async function SkipRecurringTransaction(id: string) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const recurring = await prisma.recurringTransaction.findUnique({
		where: { id, userId: user.id },
	});

	if (!recurring) {
		throw new Error("Recurring transaction not found");
	}

	// Just move the date forward without creating a transaction
	const nextDate = calculateNextDate(
		recurring.date,
		recurring.interval as RecurringInterval,
	);

	await prisma.recurringTransaction.update({
		where: { id },
		data: {
			date: nextDate,
		},
	});

	revalidatePath("/");
}

export interface SuspectedSubscription {
	description: string;
	amount: number;
	interval: RecurringInterval;
	type: "income" | "expense";
	category: string;
	categoryIcon: string;
	nextDate: Date;
	confidence: number; // 0-1 score
}

export async function DetectRecurringTransactions(): Promise<
	SuspectedSubscription[]
> {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	// 1. Fetch recent transactions (last 6 months)
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

	const transactions = await prisma.transaction.findMany({
		where: {
			userId: user.id,
			date: { gte: sixMonthsAgo },
		},
		orderBy: { date: "desc" },
	});

	// 2. Group by description (normalized)
	const groups: Record<string, typeof transactions> = {};
	for (const tx of transactions) {
		const key = tx.description.toLowerCase().trim();
		if (!groups[key]) groups[key] = [];
		groups[key].push(tx);
	}

	const candidates: SuspectedSubscription[] = [];

	// 3. Analyze groups
	for (const [key, txs] of Object.entries(groups)) {
		if (txs.length < 2) continue;

		// Sort by date desc (already sorted but just to be safe)
		txs.sort((a, b) => b.date.getTime() - a.date.getTime());

		// Check if amounts are consistent (most recent ones)
		// We allow detecting even if price changed, but for now let's stick to consistent amount
		// or ensure the most recent 2-3 are same.
		const recentAmount = txs[0].amount;
		// Check if at least 70% of transactions have this amount
		const sameAmountCount = txs.filter(
			(t) => Math.abs(t.amount - recentAmount) < 0.01,
		).length;
		if (sameAmountCount / txs.length < 0.7) continue;

		// Calculate intervals
		const intervals: number[] = [];
		for (let i = 0; i < txs.length - 1; i++) {
			const diffTime = Math.abs(
				txs[i].date.getTime() - txs[i + 1].date.getTime(),
			);
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			intervals.push(diffDays);
		}

		if (intervals.length === 0) continue;

		const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

		// Determine if it matches a standard interval
		let interval: RecurringInterval | null = null;
		let confidence = 0.5;

		// Daily: ~1 day
		if (Math.abs(avgInterval - 1) < 0.2) {
			interval = "daily";
			confidence = 0.9;
		}
		// Weekly: ~7 days
		else if (Math.abs(avgInterval - 7) < 2) {
			interval = "weekly";
			confidence = 0.8;
		}
		// Monthly: ~30 days (28-31)
		else if (Math.abs(avgInterval - 30) < 5) {
			interval = "monthly";
			confidence = 0.85;
		}
		// Yearly: ~365 days
		else if (Math.abs(avgInterval - 365) < 10) {
			interval = "yearly";
			confidence = 0.9;
		}

		if (interval) {
			// Predict next date
			const lastDate = txs[0].date;
			const nextDate = calculateNextDate(lastDate, interval);

			// Check if it's already in recurring transactions
			// We do this check later or here? Better later to fetch once.

			candidates.push({
				description: txs[0].description, // Use original case
				amount: recentAmount,
				interval,
				type: txs[0].type as "income" | "expense",
				category: txs[0].category,
				categoryIcon: txs[0].categoryIcon,
				nextDate,
				confidence,
			});
		}
	}

	// 4. Filter out existing subscriptions
	const existing = await prisma.recurringTransaction.findMany({
		where: { userId: user.id },
	});

	const existingMap = new Set(
		existing.map((e) => e.description.toLowerCase().trim()),
	);

	return candidates.filter(
		(c) => !existingMap.has(c.description.toLowerCase().trim()),
	);
}

export async function GetUpcomingRecurringTransactions(days: number = 3) {
	const user = await currentUser();
	if (!user) throw new Error("User not authenticated");

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const future = new Date(today);
	future.setDate(future.getDate() + days);

	// Fetch recurring transactions due on or before target date
	// We filter locally or in query.
	return await prisma.recurringTransaction.findMany({
		where: {
			userId: user.id,
			date: {
				lte: future,
			},
		},
		orderBy: {
			date: "asc",
		},
	});
}
