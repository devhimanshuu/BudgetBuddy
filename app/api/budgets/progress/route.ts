import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const month = searchParams.get("month");
	const year = searchParams.get("year");

	const querySchema = z.object({
		month: z.string(),
		year: z.string(),
	});

	const queryParams = querySchema.safeParse({ month, year });

	if (!queryParams.success) {
		return Response.json(queryParams.error, { status: 400 });
	}

	const monthNum = parseInt(queryParams.data.month);
	const yearNum = parseInt(queryParams.data.year);

	// Get all budgets for the month
	const budgets = await prisma.budget.findMany({
		where: {
			userId: user.id,
			month: monthNum,
			year: yearNum,
		},
	});

	// Get actual spending for each category in the month
	const startDate = new Date(yearNum, monthNum, 1);
	const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59);

	const transactions = await prisma.transaction.findMany({
		where: {
			userId: user.id,
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

	// Calculate spending per category
	const spendingByCategory: { [key: string]: number } = {};
	transactions.forEach((transaction) => {
		if (transaction.splits && transaction.splits.length > 0) {
			transaction.splits.forEach((split) => {
				if (!spendingByCategory[split.category]) {
					spendingByCategory[split.category] = 0;
				}
				spendingByCategory[split.category] += split.amount;
			});
		} else {
			if (!spendingByCategory[transaction.category]) {
				spendingByCategory[transaction.category] = 0;
			}
			spendingByCategory[transaction.category] += transaction.amount;
		}
	});

	// Combine budgets with actual spending
	const budgetProgress = budgets.map((budget) => {
		const spent = spendingByCategory[budget.category] || 0;
		const remaining = budget.amount - spent;
		const percentage = (spent / budget.amount) * 100;

		// Calculate spending projection
		const now = new Date();
		const firstDayOfMonth = new Date(yearNum, monthNum, 1);
		const lastDayOfMonth = new Date(yearNum, monthNum + 1, 0);
		const totalDaysInMonth = lastDayOfMonth.getDate();
		const daysPassed = Math.max(
			1,
			now.getDate() - firstDayOfMonth.getDate() + 1,
		);
		const daysRemaining = Math.max(0, totalDaysInMonth - daysPassed);

		// Project spending based on current pace
		const dailySpendingRate = spent / daysPassed;
		const projectedSpending = dailySpendingRate * totalDaysInMonth;
		const projectedOverspend = Math.max(0, projectedSpending - budget.amount);
		const isProjectedToOverspend = projectedSpending > budget.amount;

		return {
			id: budget.id,
			category: budget.category,
			categoryIcon: budget.categoryIcon,
			budgetAmount: budget.amount,
			spent,
			remaining,
			percentage: Math.min(percentage, 100),
			isOverBudget: spent > budget.amount,
			isNearLimit: percentage >= 80 && percentage < 100,
			projectedSpending,
			projectedOverspend,
			isProjectedToOverspend,
			dailySpendingRate,
			daysRemaining,
		};
	});

	return Response.json(budgetProgress);
}
