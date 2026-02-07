import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkBudgetStatus } from "@/lib/budgetAlerts";

/**
 * Check budget alerts for a specific category after a transaction
 * Returns alert information if budget threshold is crossed
 */
export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const category = searchParams.get("category");
	const amount = searchParams.get("amount");

	const querySchema = z.object({
		category: z.string(),
		amount: z.string(),
	});

	const queryParams = querySchema.safeParse({ category, amount });

	if (!queryParams.success) {
		return Response.json(queryParams.error, { status: 400 });
	}

	const transactionAmount = parseFloat(queryParams.data.amount);
	const currentDate = new Date();
	const currentMonth = currentDate.getMonth();
	const currentYear = currentDate.getFullYear();

	// Get budget for this category in current month
	const budget = await prisma.budget.findFirst({
		where: {
			userId: user.id,
			category: queryParams.data.category,
			month: currentMonth,
			year: currentYear,
		},
	});

	if (!budget) {
		// No budget set for this category
		return Response.json({ hasAlert: false });
	}

	// Get current spending for this category this month
	const startDate = new Date(currentYear, currentMonth, 1);
	const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

	const transactions = await prisma.transaction.findMany({
		where: {
			userId: user.id,
			OR: [
				{ category: queryParams.data.category },
				{ splits: { some: { category: queryParams.data.category } } },
			],
			type: "expense",
			date: {
				gte: startDate,
				lte: endDate,
			},
		},
		include: {
			splits: true,
		},
	});

	// Calculate current spending for this category
	let currentSpent = 0;
	transactions.forEach((t) => {
		if (t.splits && t.splits.length > 0) {
			const relevantSplits = t.splits.filter(
				(s) => s.category === queryParams.data.category,
			);
			relevantSplits.forEach((s) => (currentSpent += s.amount));
		} else if (t.category === queryParams.data.category) {
			currentSpent += t.amount;
		}
	});

	const newTotal = currentSpent + transactionAmount;

	// Check budget status with new amount
	const alert = checkBudgetStatus(
		budget.category,
		budget.categoryIcon,
		budget.amount,
		newTotal,
		currentDate,
	);

	if (alert.level === "none") {
		return Response.json({ hasAlert: false });
	}

	return Response.json({
		hasAlert: true,
		alert: {
			level: alert.level,
			message: alert.message,
			category: alert.category,
			categoryIcon: alert.categoryIcon,
			budgetAmount: alert.budgetAmount,
			spent: alert.spent,
			percentage: alert.percentage,
			remaining: alert.remaining,
		},
	});
}
