import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GetFormatterForCurrency } from "@/lib/helper";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const category = searchParams.get("category");
	const month = searchParams.get("month");
	const year = searchParams.get("year");

	const querySchema = z.object({
		category: z.string(),
		month: z.string(),
		year: z.string(),
	});

	const queryParams = querySchema.safeParse({ category, month, year });

	if (!queryParams.success) {
		return Response.json(queryParams.error, { status: 400 });
	}

	const monthNum = parseInt(queryParams.data.month);
	const yearNum = parseInt(queryParams.data.year);
	const startDate = new Date(yearNum, monthNum, 1);
	const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59);

	const [userSettings, transactions] = await Promise.all([
		prisma.userSettings.findUnique({
			where: { userId: user.id },
		}),
		prisma.transaction.findMany({
			where: {
				userId: user.id,
				type: "expense",
				date: {
					gte: startDate,
					lte: endDate,
				},
				OR: [
					{
						category: queryParams.data.category,
						splits: { none: {} },
					},
					{
						splits: { some: { category: queryParams.data.category } },
					},
				],
			},
			include: {
				splits: true,
				tags: {
					include: {
						tag: true,
					},
				},
				attachments: true,
			},
			orderBy: {
				date: "desc",
			},
		}),
	]);

	if (!userSettings) {
		throw new Error("User settings not found");
	}

	const formatter = GetFormatterForCurrency(userSettings.currency);

	const results = transactions.map((t) => {
		// If it's a split transaction, we want to show the amount for this specific category
		let displayAmount = t.amount;
		let isSplit = false;

		if (t.splits && t.splits.length > 0) {
			const relevantSplit = t.splits.find(
				(s) => s.category === queryParams.data.category,
			);
			if (relevantSplit) {
				displayAmount = relevantSplit.amount;
				isSplit = true;
			}
		}

		return {
			id: t.id,
			date: t.date,
			description: t.description,
			amount: displayAmount,
			totalAmount: t.amount,
			formattedAmount: formatter.format(displayAmount),
			formattedTotalAmount: formatter.format(t.amount),
			category: t.category,
			categoryIcon: t.categoryIcon,
			isSplit,
			notes: t.notes,
			tags: t.tags.map((tt) => tt.tag),
			attachmentsCount: t.attachments.length,
		};
	});

	return Response.json(results);
}
