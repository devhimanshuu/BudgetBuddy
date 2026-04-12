import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";

const luxuryCategories = [
	"Shopping",
	"Entertainment",
	"Travel",
	"Dining",
	"Luxury",
	"Misc",
];

export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace(user.id);
	if (!workspace)
		return Response.json({ error: "No active workspace" }, { status: 400 });
	if (workspace.role === "VIEWER")
		return Response.json(
			{ error: "Viewers cannot create budgets" },
			{ status: 403 },
		);

	const body = await request.json();

	const bodySchema = z.object({
		month: z.number().min(0).max(11),
		year: z.number(),
	});

	const parsedBody = bodySchema.safeParse(body);

	if (!parsedBody.success) {
		return Response.json(parsedBody.error, { status: 400 });
	}

	const { month, year } = parsedBody.data;

	const targetDate = new Date(year, month, 1);
	const startDate = new Date(targetDate);
	startDate.setMonth(startDate.getMonth() - 3);

	const transactions = await prisma.transaction.findMany({
		where: {
			workspaceId: workspace.id,
			type: "expense",
			date: {
				gte: startDate,
				lt: targetDate,
			},
			deletedAt: null,
		},
	});

	if (transactions.length === 0) {
		return Response.json(
			{ message: "Not enough transaction history yet." },
			{ status: 400 },
		);
	}

	const categoryTotals: Record<string, { total: number; icon: string }> = {};

	for (const t of transactions) {
		if (!categoryTotals[t.category]) {
			categoryTotals[t.category] = { total: 0, icon: t.categoryIcon };
		}
		categoryTotals[t.category].total += t.amount;
	}

	let createdCount = 0;
	let reducedCategories = [];

	for (const [category, data] of Object.entries(categoryTotals)) {
		let average = data.total / 3;

		if (luxuryCategories.includes(category)) {
			average = average * 0.95;
			reducedCategories.push(category);
		}

		average = Math.ceil(average);

		if (average <= 0) continue;

		await prisma.budget.upsert({
			where: {
				userId_category_month_year: {
					userId: user.id,
					category,
					month,
					year,
				},
			},
			update: {
				amount: average,
				categoryIcon: data.icon,
				workspaceId: workspace.id,
				deletedAt: null,
			},
			create: {
				userId: user.id,
				workspaceId: workspace.id,
				category,
				categoryIcon: data.icon,
				amount: average,
				month,
				year,
			},
		});
		createdCount++;
	}

	const userName = user.firstName
		? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
		: user.emailAddresses[0].emailAddress.split("@")[0];

	await logActivity({
		workspaceId: workspace.id,
		userId: user.id,
		type: "BUDGET_UPDATED",
		description: `${userName} used Auto-Suggest to create ${createdCount} budgets for ${
			month + 1
		}/${year}`,
		metadata: { userName, month, year, createdCount },
	});

    let message = `Auto-suggested ${createdCount} budget categories based on your 3-month average.`;
    if (reducedCategories.length > 0) {
        message += ` Discretionary spending (${reducedCategories.join(", ")}) was reduced by 5% to boost savings ✨`;
    }

	return Response.json(
		{
			message,
		},
		{ status: 201 },
	);
}
