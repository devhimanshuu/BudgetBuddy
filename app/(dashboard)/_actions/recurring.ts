"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

// Helper to calculate next date
function calculateNextDate(
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
