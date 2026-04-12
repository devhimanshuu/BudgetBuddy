import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace(user.id);
	if (!workspace || workspace.role === "VIEWER") {
		return Response.json({ error: "Unauthorized" }, { status: 403 });
	}

	const body = await request.json();

	const bodySchema = z.object({
		month: z.number().min(0).max(11),
		year: z.number(),
		previousBudgets: z.array(
			z.object({
				category: z.string(),
				categoryIcon: z.string(),
				amount: z.number().positive(),
			})
		),
	});

	const parsedBody = bodySchema.safeParse(body);

	if (!parsedBody.success) {
		return Response.json(parsedBody.error, { status: 400 });
	}

	const { month, year, previousBudgets } = parsedBody.data;

	// First, delete all current budgets for this month/year
	await prisma.budget.deleteMany({
		where: {
			...(workspace.id ? { workspaceId: workspace.id } : { userId: user.id }),
			month,
			year,
		},
	});

	// Then, recreate from previousBudgets
	if (previousBudgets.length > 0) {
		await prisma.budget.createMany({
			data: previousBudgets.map((b) => ({
				userId: user.id,
				workspaceId: workspace.id,
				category: b.category,
				categoryIcon: b.categoryIcon,
				amount: b.amount,
				month,
				year,
			})),
		});
	}

	return Response.json({ success: true, message: "Restored previous budgets" }, { status: 200 });
}
