import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkAchievements } from "@/lib/gamification";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace(user.id);
	const workspaceId = workspace?.id;

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

	const budgets = await prisma.budget.findMany({
		where: {
			...(workspaceId ? { workspaceId } : { userId: user.id }),
			month: parseInt(queryParams.data.month),
			year: parseInt(queryParams.data.year),
		},
		orderBy: {
			category: "asc",
		},
	});

	return Response.json(budgets);
}

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
		category: z.string(),
		categoryIcon: z.string(),
		amount: z.number().positive(),
		month: z.number().min(0).max(11),
		year: z.number(),
	});

	const parsedBody = bodySchema.safeParse(body);

	if (!parsedBody.success) {
		return Response.json(parsedBody.error, { status: 400 });
	}

	const { category, categoryIcon, amount, month, year } = parsedBody.data;

	// Upsert budget (create or update if exists)
	const budget = await prisma.budget.upsert({
		where: {
			userId_category_month_year: {
				userId: user.id,
				category,
				month,
				year,
			},
		},
		update: {
			amount,
			categoryIcon,
			workspaceId: workspace.id,
		},
		create: {
			userId: user.id,
			workspaceId: workspace.id,
			category,
			categoryIcon,
			amount,
			month,
			year,
		},
	});

	// Check budget achievements
	const unlockedAchievements = await checkAchievements(user.id, {
		type: "budget",
	});

	return Response.json({ budget, unlockedAchievements }, { status: 201 });
}

export async function PATCH(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace(user.id);
	if (!workspace)
		return Response.json({ error: "No active workspace" }, { status: 400 });
	if (workspace.role === "VIEWER")
		return Response.json(
			{ error: "Viewers cannot update budgets" },
			{ status: 403 },
		);

	const body = await request.json();

	const bodySchema = z.object({
		category: z.string(),
		month: z.number(),
		year: z.number(),
		amount: z.number().positive(),
		categoryIcon: z.string().optional(),
	});

	const parsedBody = bodySchema.safeParse(body);

	if (!parsedBody.success) {
		return Response.json(parsedBody.error, { status: 400 });
	}

	const { category, month, year, amount, categoryIcon } = parsedBody.data;

	// Verify ownership before updating
	const existingBudget = await prisma.budget.findUnique({
		where: {
			userId_category_month_year: {
				userId: user.id,
				category,
				month,
				year,
			},
		},
	});

	if (!existingBudget) {
		return Response.json({ error: "Budget not found" }, { status: 404 });
	}

	const updateData: { amount: number; categoryIcon?: string } = { amount };
	if (categoryIcon) updateData.categoryIcon = categoryIcon;

	const budget = await prisma.budget.update({
		where: {
			userId_category_month_year: {
				userId: user.id,
				category,
				month,
				year,
			},
		},
		data: updateData,
	});

	return Response.json(budget);
}

export async function DELETE(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace(user.id);
	if (!workspace)
		return Response.json({ error: "No active workspace" }, { status: 400 });
	if (workspace.role === "VIEWER")
		return Response.json(
			{ error: "Viewers cannot delete budgets" },
			{ status: 403 },
		);

	const { searchParams } = new URL(request.url);
	const category = searchParams.get("category");
	const month = searchParams.get("month");
	const year = searchParams.get("year");

	if (!category || !month || !year) {
		return Response.json(
			{ error: "category, month, and year are required" },
			{ status: 400 },
		);
	}

	// Verify ownership before deleting
	const budget = await prisma.budget.findUnique({
		where: {
			userId_category_month_year: {
				userId: user.id,
				category,
				month: parseInt(month),
				year: parseInt(year),
			},
		},
	});

	if (!budget) {
		return Response.json({ error: "Budget not found" }, { status: 404 });
	}

	await prisma.budget.update({
		where: {
			userId_category_month_year: {
				userId: user.id,
				category,
				month: parseInt(month),
				year: parseInt(year),
			},
		},
		data: { deletedAt: new Date() },
	});

	return Response.json({ success: true });
}

