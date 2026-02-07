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
	const category = searchParams.get("category");
	const monthsBack = searchParams.get("monthsBack") || "6";

	const querySchema = z.object({
		category: z.string(),
		monthsBack: z.string(),
	});

	const queryParams = querySchema.safeParse({ category, monthsBack });

	if (!queryParams.success) {
		return Response.json(queryParams.error, { status: 400 });
	}

	const months = parseInt(queryParams.data.monthsBack);
	const now = new Date();
	const historicalData = [];

	const totalStartDate = new Date(
		now.getFullYear(),
		now.getMonth() - months + 1,
		1,
	);

	// Get all potential transactions for the entire period
	const transactions = await prisma.transaction.findMany({
		where: {
			userId: user.id,
			type: "expense",
			date: {
				gte: totalStartDate,
			},
			OR: [
				{ category: queryParams.data.category },
				{ splits: { some: { category: queryParams.data.category } } },
			],
		},
		include: {
			splits: true,
		},
	});

	// Calculate monthly spending
	for (let i = months - 1; i >= 0; i--) {
		const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const month = targetDate.getMonth();
		const year = targetDate.getFullYear();

		const monthlyTransactions = transactions.filter((t) => {
			const tDate = new Date(t.date);
			return tDate.getMonth() === month && tDate.getFullYear() === year;
		});

		let totalSpent = 0;
		monthlyTransactions.forEach((t) => {
			if (t.splits && t.splits.length > 0) {
				// Find splits for this category
				const relevantSplits = t.splits.filter(
					(s) => s.category === queryParams.data.category,
				);
				relevantSplits.forEach((s) => (totalSpent += s.amount));
			} else if (t.category === queryParams.data.category) {
				totalSpent += t.amount;
			}
		});

		historicalData.push({
			month: targetDate.toLocaleDateString("en-US", { month: "short" }),
			year: year,
			spent: totalSpent,
		});
	}

	return Response.json(historicalData);
}
