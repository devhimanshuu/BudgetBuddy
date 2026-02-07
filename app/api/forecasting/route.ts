import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function normalizeDate(date: Date) {
	const normalized = new Date(date);
	normalized.setHours(0, 0, 0, 0);
	return normalized;
}

function toDateKey(date: Date) {
	return normalizeDate(date).toISOString().split("T")[0];
}

function median(values: number[]) {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		return (sorted[mid - 1] + sorted[mid]) / 2;
	}
	return sorted[mid];
}

function percentile(values: number[], p: number) {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const index = (sorted.length - 1) * p;
	const lower = Math.floor(index);
	const upper = Math.ceil(index);
	if (lower === upper) return sorted[lower];
	const weight = index - lower;
	return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function round2(value: number) {
	return Number(value.toFixed(2));
}

function addInterval(date: Date, interval: string) {
	const next = new Date(date);
	switch (interval) {
		case "daily":
			next.setDate(next.getDate() + 1);
			break;
		case "weekly":
			next.setDate(next.getDate() + 7);
			break;
		case "monthly":
			next.setMonth(next.getMonth() + 1);
			break;
		case "yearly":
			next.setFullYear(next.getFullYear() + 1);
			break;
		default:
			next.setMonth(next.getMonth() + 1);
			break;
	}
	return next;
}

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const monthsParam = searchParams.get("months") || "6";
	const parsedMonths = Number.parseInt(monthsParam, 10);
	const months =
		Number.isFinite(parsedMonths) && parsedMonths > 0
			? Math.min(parsedMonths, 36)
			: 6;

	try {
		const startDate = normalizeDate(new Date());
		const endDate = new Date(startDate);
		endDate.setMonth(endDate.getMonth() + months);
		const historyDays = 180;
		const minDaysRequired = 60;
		const historyStart = new Date(startDate);
		historyStart.setDate(historyStart.getDate() - historyDays);

		const [incomeSum, expenseSum] = await Promise.all([
			prisma.transaction.aggregate({
				where: { userId: user.id, type: "income" },
				_sum: { amount: true },
			}),
			prisma.transaction.aggregate({
				where: { userId: user.id, type: "expense" },
				_sum: { amount: true },
			}),
		]);

		const currentBalance =
			(incomeSum._sum.amount || 0) - (expenseSum._sum.amount || 0);

		const historyTransactions = await prisma.transaction.findMany({
			where: {
				userId: user.id,
				date: {
					gte: historyStart,
					lt: startDate,
				},
			},
			select: {
				amount: true,
				date: true,
				type: true,
			},
		});

		const dailyNetMap = new Map<string, number>();
		const activeDays = new Set<string>();

		for (const transaction of historyTransactions) {
			const key = toDateKey(transaction.date);
			activeDays.add(key);
			const current = dailyNetMap.get(key) || 0;
			const delta =
				transaction.type === "income"
					? transaction.amount
					: -transaction.amount;
			dailyNetMap.set(key, current + delta);
		}

		const historySeries: { date: Date; net: number }[] = [];
		for (
			let cursor = new Date(historyStart);
			cursor < startDate;
			cursor.setDate(cursor.getDate() + 1)
		) {
			const key = toDateKey(cursor);
			const net = dailyNetMap.get(key) ?? 0;
			historySeries.push({ date: new Date(cursor), net });
		}

		const absValues = historySeries.map((entry) => Math.abs(entry.net));
		const p95Net = percentile(absValues, 0.95);
		const cappedSeries = historySeries.map((entry) => ({
			date: entry.date,
			net: clamp(entry.net, -p95Net, p95Net),
		}));

		const cappedValues = cappedSeries.map((entry) => entry.net);
		const medianNet = median(cappedValues);
		const mad = median(cappedValues.map((value) => Math.abs(value - medianNet)));
		const dailyBand = 1.5 * mad;

		const weekdayTotals = new Array(7).fill(0);
		const weekdayCounts = new Array(7).fill(0);
		for (const entry of cappedSeries) {
			const weekday = entry.date.getDay();
			weekdayTotals[weekday] += entry.net;
			weekdayCounts[weekday] += 1;
		}
		const weekdayAverages = weekdayTotals.map((total, index) =>
			weekdayCounts[index] > 0 ? total / weekdayCounts[index] : medianNet,
		);

		if (activeDays.size < minDaysRequired) {
			return NextResponse.json({
				projection: [],
				currentBalance,
				stats: {
					insufficientData: true,
					minDaysRequired,
					availableDays: activeDays.size,
					historyDays,
				},
			});
		}

		const recurringTransactions = await prisma.recurringTransaction.findMany({
			where: { userId: user.id },
		});

		const recurringMap = new Map<
			string,
			{ income: number; expense: number }
		>();

		for (const recurring of recurringTransactions) {
			let nextDate = normalizeDate(new Date(recurring.date));

			while (nextDate < startDate) {
				nextDate = addInterval(nextDate, recurring.interval);
			}

			while (nextDate <= endDate) {
				const key = nextDate.toISOString().split("T")[0];
				const entry = recurringMap.get(key) || { income: 0, expense: 0 };
				if (recurring.type === "income") {
					entry.income += recurring.amount;
				} else {
					entry.expense += recurring.amount;
				}
				recurringMap.set(key, entry);
				nextDate = addInterval(nextDate, recurring.interval);
			}
		}

		let balance = currentBalance;
		let balanceLow = currentBalance;
		let balanceHigh = currentBalance;
		const projection: {
			date: string;
			balance: number;
			low: number;
			high: number;
			band: number;
		}[] = [];

		for (
			let cursor = new Date(startDate);
			cursor <= endDate;
			cursor.setDate(cursor.getDate() + 1)
		) {
			const key = toDateKey(cursor);
			const weekday = cursor.getDay();
			const baselineNet = weekdayAverages[weekday] ?? medianNet;

			balance += baselineNet;
			balanceLow += baselineNet - dailyBand;
			balanceHigh += baselineNet + dailyBand;

			const recurring = recurringMap.get(key);
			if (recurring) {
				const recurringNet = recurring.income - recurring.expense;
				balance += recurringNet;
				balanceLow += recurringNet;
				balanceHigh += recurringNet;
			}

			projection.push({
				date: key,
				balance: round2(balance),
				low: round2(balanceLow),
				high: round2(balanceHigh),
				band: round2(balanceHigh - balanceLow),
			});
		}

		return NextResponse.json({
			projection,
			currentBalance,
			stats: {
				recurringCount: recurringTransactions.length,
				historyDays,
				availableDays: activeDays.size,
				minDaysRequired,
				medianDailyNet: round2(medianNet),
				madDailyNet: round2(mad),
				p95DailyNet: round2(p95Net),
				dailyBand: round2(dailyBand),
				summary:
					"Based on last 180 days with weekday seasonality, outlier capping at the 95th percentile, and a confidence band from 1.5× MAD.",
			},
		});
	} catch (error) {
		console.error("Forecasting error:", error);
		return NextResponse.json(
			{ error: "Failed to generate forecast" },
			{ status: 500 },
		);
	}
}
