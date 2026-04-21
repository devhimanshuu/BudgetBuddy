import prisma from "@/lib/prisma";
import { Period, TimeFrame } from "@/lib/type";
import { currentUser } from "@clerk/nextjs/server";
import { getDaysInMonth } from "date-fns";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace, getMemberRestrictions } from "@/lib/workspaces";

const getHistoryDataSchema = z.object({
	timeframe: z.enum(["month", "year"]),
	month: z.coerce.number().min(0).max(11).default(0),
	year: z.coerce.number().min(2000).max(3000),
});

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const timeframe = searchParams.get("timeframe");
	const year = searchParams.get("year");
	const month = searchParams.get("month");

	const queryParams = getHistoryDataSchema.safeParse({
		timeframe,
		month,
		year,
	});

	if (!queryParams.success) {
		return Response.json(queryParams.error.message, {
			status: 400,
		});
	}

	const workspace = await getActiveWorkspace();
	const workspaceId = workspace?.id;

	const data = await getHistoryData(
		user.id,
		queryParams.data.timeframe,
		{
			month: queryParams.data.month,
			year: queryParams.data.year,
		},
		workspaceId,
	);

	return Response.json(data);
}

export type GetHistoryDataResponseType = Awaited<
	ReturnType<typeof getHistoryData>
>;

async function getHistoryData(
	userId: string,
	timeframe: TimeFrame,
	period: Period,
	workspaceId?: string,
) {
	switch (timeframe) {
		case "year":
			return await getYearHistoryData(userId, period.year, workspaceId);
		case "month":
			return await getMonthHistoryData(
				userId,
				period.year,
				period.month,
				workspaceId,
			);
		default:
			throw new Error(`Invalid timeframe: ${timeframe}`);
	}
}

type HistoryData = {
	expense: number;
	income: number;
	investment: number;
	year: number;
	month: number;
	day?: number;
};

async function getYearHistoryData(
	userId: string,
	year: number,
	workspaceId?: string,
) {
	const restrictions = workspaceId ? await getMemberRestrictions(userId, workspaceId) : null;

	if (restrictions?.allowedCategories) {
		const transactions = await prisma.transaction.findMany({
			where: {
				workspaceId,
				date: {
					gte: new Date(year, 0, 1),
					lte: new Date(year, 11, 31, 23, 59, 59),
				},
				category: { in: restrictions.allowedCategories },
				status: "APPROVED",
			},
		});

		const history: HistoryData[] = Array.from({ length: 12 }, (_, i) => ({
			year,
			month: i,
			expense: 0,
			income: 0,
			investment: 0,
		}));

		transactions.forEach((t) => {
			const m = t.date.getMonth();
			if (t.type === "expense") history[m].expense += t.amount;
			else if (t.type === "income") history[m].income += t.amount;
			else if (t.type === "investment") history[m].investment += t.amount;
		});

		return history;
	}

	const result = await prisma.yearHistory.groupBy({
		by: ["month"],
		where: {
			...(workspaceId ? { workspaceId } : { userId }),
			year,
		},
		_sum: {
			expense: true,
			income: true,
			investment: true,
		},
		orderBy: [
			{
				month: "asc",
			},
		],
	});

	if (!result || result.length === 0) return [];

	const history: HistoryData[] = [];

	for (let i = 0; i < 12; i++) {
		let expense = 0;
		let income = 0;
		let investment = 0;

		const month = result.find((row) => row.month === i);
		if (month) {
			expense = month._sum.expense != null ? Number(month._sum.expense) : 0;
			income = month._sum.income != null ? Number(month._sum.income) : 0;
			investment = month._sum.investment != null ? Number(month._sum.investment) : 0;
		}

		history.push({
			year,
			month: i,
			expense,
			income,
			investment,
		});
	}

	return history;
}

async function getMonthHistoryData(
	userId: string,
	year: number,
	month: number,
	workspaceId?: string,
) {
	const restrictions = workspaceId ? await getMemberRestrictions(userId, workspaceId) : null;

	if (restrictions?.allowedCategories) {
		const startDate = new Date(year, month, 1);
		const endDate = new Date(year, month + 1, 0, 23, 59, 59);

		const transactions = await prisma.transaction.findMany({
			where: {
				workspaceId,
				date: {
					gte: startDate,
					lte: endDate,
				},
				category: { in: restrictions.allowedCategories },
				status: "APPROVED",
			},
		});

		const daysInMonth = getDaysInMonth(new Date(year, month));
		const history: HistoryData[] = Array.from({ length: daysInMonth }, (_, i) => ({
			year,
			month,
			day: i + 1,
			expense: 0,
			income: 0,
			investment: 0,
		}));

		transactions.forEach((t) => {
			const d = t.date.getDate() - 1;
			if (t.type === "expense") history[d].expense += t.amount;
			else if (t.type === "income") history[d].income += t.amount;
			else if (t.type === "investment") history[d].investment += t.amount;
		});

		return history;
	}

	const result = await prisma.monthlyHistory.groupBy({
		by: ["day"],
		where: {
			...(workspaceId ? { workspaceId } : { userId }),
			year,
			month,
		},
		_sum: {
			expense: true,
			income: true,
			investment: true,
		},
		orderBy: [
			{
				day: "asc",
			},
		],
	});

	if (!result || result.length === 0) return [];

	const history: HistoryData[] = [];
	const daysInMonth = getDaysInMonth(new Date(year, month));
	for (let i = 1; i <= daysInMonth; i++) {
		let expense = 0;
		let income = 0;
		let investment = 0;

		const day = result.find((row) => row.day === i);
		if (day) {
			expense = day._sum.expense != null ? Number(day._sum.expense) : 0;
			income = day._sum.income != null ? Number(day._sum.income) : 0;
			investment = day._sum.investment != null ? Number(day._sum.investment) : 0;
		}

		history.push({
			expense,
			income,
			investment,
			year,
			month,
			day: i,
		});
	}

	return history;
}
