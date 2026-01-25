import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eachDayOfInterval, format, parseISO, startOfDay } from "date-fns";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");
	const cat1 = searchParams.get("cat1");
	const cat2 = searchParams.get("cat2");
	const tags = searchParams.get("tags");

	const querySchema = z.object({
		from: z.string(),
		to: z.string(),
		cat1: z.string(),
		cat2: z.string(),
	});

	const queryParams = querySchema.safeParse({ from, to, cat1, cat2 });

	if (!queryParams.success) {
		return Response.json(queryParams.error, { status: 400 });
	}

	const fromDate = startOfDay(new Date(queryParams.data.from));
	const toDate = startOfDay(new Date(queryParams.data.to));
	const tagIds = tags ? tags.split(",") : [];

	// Fetch transactions for both categories
	const transactions = await prisma.transaction.findMany({
		where: {
			userId: user.id,
			category: {
				in: [queryParams.data.cat1, queryParams.data.cat2],
			},
			date: {
				gte: fromDate,
				lte: toDate,
			},
			...(tagIds.length > 0 && {
				tags: {
					some: {
						tagId: {
							in: tagIds,
						},
					},
				},
			}),
		},
		select: {
			amount: true,
			date: true,
			category: true,
		},
	});

	// Create a map of dates to amounts
	const dateMap = new Map<string, { amount1: number; amount2: number }>();

	// Initialize with zeroes for all days in interval to ensure smooth chart
	const days = eachDayOfInterval({ start: fromDate, end: toDate });
	days.forEach((day) => {
		dateMap.set(format(day, "yyyy-MM-dd"), { amount1: 0, amount2: 0 });
	});

	transactions.forEach((tx) => {
		const dateStr = format(tx.date, "yyyy-MM-dd");
		const entry = dateMap.get(dateStr);
		if (entry) {
			if (tx.category === queryParams.data.cat1) {
				entry.amount1 += tx.amount;
			} else {
				entry.amount2 += tx.amount;
			}
		}
	});

	const result = Array.from(dateMap.entries())
		.map(([date, data]) => ({
			date,
			amount1: data.amount1,
			amount2: data.amount2,
		}))
		.sort((a, b) => a.date.localeCompare(b.date));

	return Response.json(result);
}
