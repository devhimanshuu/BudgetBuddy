import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isBefore, isSameDay, addDays } from "date-fns";
import { CalendarDayData } from "@/lib/type";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	if (!workspace) {
		throw new Error("No active workspace found");
	}

	const { searchParams } = new URL(request.url);
	const month = searchParams.get("month");
	const year = searchParams.get("year");
	const multiplier = searchParams.get("multiplier") || "1.5";

	// Validate parameters
	const validator = z.object({
		month: z.string().regex(/^\d{1,2}$/),
		year: z.string().regex(/^\d{4}$/),
		multiplier: z.string().regex(/^\d+(\.\d+)?$/),
	});

	const queryParams = validator.safeParse({ month, year, multiplier });
	if (!queryParams.success) {
		return Response.json({ error: "Invalid parameters" }, { status: 400 });
	}

	const monthNum = parseInt(queryParams.data.month);
	const yearNum = parseInt(queryParams.data.year);
	const multiplierNum = parseFloat(queryParams.data.multiplier);

	// Create date range for the month
	const startDate = startOfMonth(new Date(yearNum, monthNum - 1));
	const endDate = endOfMonth(new Date(yearNum, monthNum - 1));

	// Fetch all transactions, recurring bills, and savings goals
	const [transactions, recurringBills, savingsGoals] = await Promise.all([
		prisma.transaction.findMany({
			where: {
				workspaceId: workspace.id,
				date: { gte: startDate, lte: endDate },
				deletedAt: null,
			},
			orderBy: { date: "asc" },
		}),
		prisma.recurringTransaction.findMany({
			where: { workspaceId: workspace.id, deletedAt: null },
		}),
		prisma.savingsGoal.findMany({
			where: { workspaceId: workspace.id, deletedAt: null, isCompleted: false },
		})
	]);

	// Group transactions by day
	const dayMap: Record<string, CalendarDayData> = {};

	// Helper to initialize day
	const initDay = (dateKey: string) => {
		if (!dayMap[dateKey]) {
			dayMap[dateKey] = {
				income: 0,
				expense: 0,
				investment: 0,
				count: 0,
				isHighSpending: false,
				transactions: [],
				isGoalMilestone: false,
				milestoneDetails: [],
				projectedBalance: 0,
				isRecurringDue: false,
				recurringItems: [],
			};
		}
	};

	// 1. Process existing transactions
	transactions.forEach((transaction) => {
		const dateKey = format(transaction.date, "yyyy-MM-dd");
		initDay(dateKey);
		const amount = transaction.amount || 0;

		dayMap[dateKey].count++;
		dayMap[dateKey].transactions.push({
			id: transaction.id,
			amount,
			description: transaction.description,
			date: transaction.date,
			type: transaction.type as any,
			category: transaction.category,
			categoryIcon: transaction.categoryIcon,
		});

		if (transaction.type === "income") dayMap[dateKey].income += amount;
		else if (transaction.type === "expense") dayMap[dateKey].expense += amount;
		else if (transaction.type === "investment") dayMap[dateKey].investment += amount;
	});

	// 2. Project recurring bills into the future
	const today = new Date();
	recurringBills.forEach(bill => {
		let nextDate = new Date(bill.date);
		// Project for the current viewed month
		while (isBefore(nextDate, endDate)) {
			if (!isBefore(nextDate, startDate)) {
				const dateKey = format(nextDate, "yyyy-MM-dd");
				initDay(dateKey);
				
				// Only show as "due" if it hasn't happened yet (is in future)
				if (nextDate > today || isSameDay(nextDate, today)) {
					dayMap[dateKey].isRecurringDue = true;
					dayMap[dateKey].recurringItems!.push({
						id: bill.id,
						description: bill.description,
						amount: bill.amount,
						type: bill.type as any,
						category: bill.category,
						categoryIcon: bill.categoryIcon,
						date: nextDate, // Include the predicted due date
					});
				}
			}

			// Advance date based on interval
			if (bill.interval === "daily") nextDate = addDays(nextDate, 1);
			else if (bill.interval === "weekly") nextDate = addDays(nextDate, 7);
			else if (bill.interval === "monthly") {
				const nextMonth = new Date(nextDate);
				nextMonth.setMonth(nextMonth.getMonth() + 1);
				nextDate = nextMonth;
			} else if (bill.interval === "yearly") {
				const nextYear = new Date(nextDate);
				nextYear.setFullYear(nextYear.getFullYear() + 1);
				nextDate = nextYear;
			} else break;
		}
	});

	// 3. Savings Goal Milestones
	savingsGoals.forEach(goal => {
		const targetDate = new Date(goal.targetDate);
		if (targetDate >= startDate && targetDate <= endDate) {
			const dateKey = format(targetDate, "yyyy-MM-dd");
			initDay(dateKey);
			dayMap[dateKey].isGoalMilestone = true;
			dayMap[dateKey].milestoneDetails!.push({
				name: goal.name,
				targetAmount: goal.targetAmount,
				icon: goal.icon
			});
		}
	});

	// 4. Calculate Stats & Thresholds
	const monthStats = {
		totalIncome: transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
		totalExpense: transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
		totalInvestment: transactions.filter(t => t.type === "investment").reduce((s, t) => s + t.amount, 0),
	};

	const daysInMonthCount = Math.max(eachDayOfInterval({ start: startDate, end: endDate }).length, 1);
	const avgDailyExpense = monthStats.totalExpense / daysInMonthCount;
	const highSpendingThreshold = avgDailyExpense * multiplierNum;

	// Mark high spending days
	Object.keys(dayMap).forEach((dateKey) => {
		if (dayMap[dateKey].expense > highSpendingThreshold) {
			dayMap[dateKey].isHighSpending = true;
		}
	});

	return Response.json({
		days: dayMap,
		monthStats: {
			totalIncome: Math.round(monthStats.totalIncome * 100) / 100,
			totalExpense: Math.round(monthStats.totalExpense * 100) / 100,
			totalInvestment: Math.round(monthStats.totalInvestment * 100) / 100,
			avgDailyExpense: Math.round(avgDailyExpense * 100) / 100,
			highSpendingThreshold: Math.round(highSpendingThreshold * 100) / 100,
		},
	});
}
