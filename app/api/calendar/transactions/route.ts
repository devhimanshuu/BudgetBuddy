import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { CalendarDayData } from "@/lib/type";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
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

	// Fetch all transactions for the month
	const transactions = await prisma.transaction.findMany({
		where: {
			userId: user.id,
			date: {
				gte: startDate,
				lte: endDate,
			},
		},
		orderBy: {
			date: "asc",
		},
	});

	// Calculate month statistics
	const monthStats = {
		totalIncome: 0,
		totalExpense: 0,
		avgDailyExpense: 0,
		highSpendingThreshold: 0,
	};

	transactions.forEach((transaction) => {
		if (transaction.type === "income") {
			monthStats.totalIncome += transaction.amount;
		} else {
			monthStats.totalExpense += transaction.amount;
		}
	});

	// Calculate average daily expense
	const daysInMonth = eachDayOfInterval({
		start: startDate,
		end: endDate,
	}).length;
	monthStats.avgDailyExpense = monthStats.totalExpense / daysInMonth;
	monthStats.highSpendingThreshold = monthStats.avgDailyExpense * multiplierNum;

	// Group transactions by day
	const dayMap: Record<string, CalendarDayData> = {};

	transactions.forEach((transaction) => {
		const dateKey = format(transaction.date, "yyyy-MM-dd");

		if (!dayMap[dateKey]) {
			dayMap[dateKey] = {
				income: 0,
				expense: 0,
				count: 0,
				isHighSpending: false,
				transactions: [],
			};
		}

		dayMap[dateKey].count++;
		dayMap[dateKey].transactions.push({
			id: transaction.id,
			amount: transaction.amount,
			description: transaction.description,
			notes: transaction.notes,
			date: transaction.date,
			type: transaction.type as "income" | "expense",
			category: transaction.category,
			categoryIcon: transaction.categoryIcon,
		});

		if (transaction.type === "income") {
			dayMap[dateKey].income += transaction.amount;
		} else {
			dayMap[dateKey].expense += transaction.amount;
		}
	});

	// Mark high spending days
	Object.keys(dayMap).forEach((dateKey) => {
		if (dayMap[dateKey].expense > monthStats.highSpendingThreshold) {
			dayMap[dateKey].isHighSpending = true;
		}
	});

	return Response.json({
		days: dayMap,
		monthStats: {
			...monthStats,
			totalIncome: Math.round(monthStats.totalIncome * 100) / 100,
			totalExpense: Math.round(monthStats.totalExpense * 100) / 100,
			avgDailyExpense: Math.round(monthStats.avgDailyExpense * 100) / 100,
			highSpendingThreshold:
				Math.round(monthStats.highSpendingThreshold * 100) / 100,
		},
	});
}
