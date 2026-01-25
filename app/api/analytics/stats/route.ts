import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { differenceInDays, subDays } from "date-fns";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	const querySchema = z.object({
		from: z.string(),
		to: z.string(),
	});

	const queryParams = querySchema.safeParse({ from, to });

	if (!queryParams.success) {
		return Response.json(queryParams.error, { status: 400 });
	}

	const fromDate = new Date(queryParams.data.from);
	const toDate = new Date(queryParams.data.to);
	const daysInPeriod = Math.max(differenceInDays(toDate, fromDate) + 1, 1);

	// Previous period for comparison
	const prevToDate = subDays(fromDate, 1);
	const prevFromDate = subDays(prevToDate, daysInPeriod - 1);

	// Helper to fetch and aggregate stats
	const getPeriodStats = async (start: Date, end: Date) => {
		const stats = await prisma.monthlyHistory.findMany({
			where: {
				userId: user.id,
			},
		});

		const filtered = stats.filter((stat) => {
			const date = new Date(stat.year, stat.month, stat.day);
			return date >= start && date <= end;
		});

		const income = filtered.reduce((sum, s) => sum + s.income, 0);
		const expense = filtered.reduce((sum, s) => sum + s.expense, 0);
		return { income, expense, count: filtered.length };
	};

	const current = await getPeriodStats(fromDate, toDate);
	const previous = await getPeriodStats(prevFromDate, prevToDate);

	const currentSavings = current.income - current.expense;
	const previousSavings = previous.income - previous.expense;

	const currentSavingsRate =
		current.income > 0 ? (currentSavings / current.income) * 100 : 0;
	const previousSavingsRate =
		previous.income > 0 ? (previousSavings / previous.income) * 100 : 0;

	const currentVelocity = current.expense / daysInPeriod;
	const previousVelocity = previous.expense / daysInPeriod;

	return Response.json({
		savingsRate: {
			current: currentSavingsRate,
			previous: previousSavingsRate,
			change: currentSavingsRate - previousSavingsRate,
		},
		disposableIncome: {
			current: currentSavings,
			previous: previousSavings,
			change: currentSavings - previousSavings,
		},
		spendVelocity: {
			current: currentVelocity,
			previous: previousVelocity,
			change:
				previousVelocity > 0
					? ((currentVelocity - previousVelocity) / previousVelocity) * 100
					: 0,
		},
		raw: {
			current,
			previous,
		},
	});
}
