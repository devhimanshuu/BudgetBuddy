import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkAchievements } from "@/lib/gamification";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";

export async function GET(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	const workspaceId = workspace?.id;

	const { searchParams } = new URL(request.url);
	const includeCompleted = searchParams.get("includeCompleted") === "true";

	const goals = await prisma.savingsGoal.findMany({
		where: {
			...(workspaceId ? { workspaceId } : { userId: user.id }),
			...(includeCompleted ? {} : { isCompleted: false }),
		},
		orderBy: [{ isCompleted: "asc" }, { targetDate: "asc" }],
	});

	return Response.json(goals);
}

export async function POST(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const workspace = await getActiveWorkspace();
	if (!workspace)
		return Response.json({ error: "No active workspace" }, { status: 400 });
	if (workspace.role === "VIEWER")
		return Response.json(
			{ error: "Viewers cannot create goals" },
			{ status: 403 },
		);

	const body = await request.json();

	const bodySchema = z.object({
		name: z.string().min(1).max(100),
		description: z.string().optional(),
		targetAmount: z.number().positive(),
		currentAmount: z.number().min(0).optional(),
		targetDate: z.string().datetime(),
		category: z.string().optional(),
		icon: z.string().optional(),
		color: z.string().optional(),
	});

	const parsedBody = bodySchema.safeParse(body);

	if (!parsedBody.success) {
		return Response.json(parsedBody.error, { status: 400 });
	}

	const goal = await prisma.savingsGoal.create({
		data: {
			userId: user.id,
			workspaceId: workspace.id,
			name: parsedBody.data.name,
			description: parsedBody.data.description,
			targetAmount: parsedBody.data.targetAmount,
			currentAmount: parsedBody.data.currentAmount || 0,
			targetDate: new Date(parsedBody.data.targetDate),
			category: parsedBody.data.category || "General",
			icon: parsedBody.data.icon || "🎯",
			color: parsedBody.data.color || "#3b82f6",
		},
	});

    const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.emailAddresses[0].emailAddress.split("@")[0];
    await logActivity({
        workspaceId: workspace.id,
        userId: user.id,
        type: "SAVINGS_GOAL_CREATED",
        description: `${userName} created savings goal: ${goal.icon} ${goal.name} (Target: ${goal.targetAmount})`,
        metadata: { userName, name: goal.name, targetAmount: goal.targetAmount }
    });

	return Response.json(goal, { status: 201 });
}

export async function PATCH(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const body = await request.json();

	const bodySchema = z.object({
		id: z.string(),
		currentAmount: z.number().min(0).optional(),
		isCompleted: z.boolean().optional(),
	});

	const parsedBody = bodySchema.safeParse(body);

	if (!parsedBody.success) {
		return Response.json(parsedBody.error, { status: 400 });
	}

	// Verify ownership
	const goal = await prisma.savingsGoal.findUnique({
		where: { id: parsedBody.data.id },
	});

	if (!goal || goal.userId !== user.id) {
		return Response.json({ error: "Goal not found" }, { status: 404 });
	}

	const updatedGoal = await prisma.savingsGoal.update({
		where: { id: parsedBody.data.id },
		data: {
			currentAmount: parsedBody.data.currentAmount,
			isCompleted: parsedBody.data.isCompleted,
		},
	});

    const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.emailAddresses[0].emailAddress.split("@")[0];
    if (goal.workspaceId) {
        if (parsedBody.data.isCompleted && !goal.isCompleted) {
            await logActivity({
                workspaceId: goal.workspaceId,
                userId: user.id,
                type: "SAVINGS_GOAL_COMPLETED",
                description: `${userName} completed savings goal: ${goal.icon} ${goal.name}! 🎉`,
                metadata: { userName, name: goal.name }
            });
        } else if (parsedBody.data.currentAmount !== undefined && parsedBody.data.currentAmount !== goal.currentAmount) {
            await logActivity({
                workspaceId: goal.workspaceId,
                userId: user.id,
                type: "SAVINGS_GOAL_UPDATED",
                description: `${userName} updated savings goal: ${goal.name} (New balance: ${parsedBody.data.currentAmount})`,
                metadata: { userName, name: goal.name, currentAmount: parsedBody.data.currentAmount }
            });
        }
    }

	// Check achievements if the goal is completed
	let unlockedAchievements: any[] = [];
	if (parsedBody.data.isCompleted && !goal.isCompleted) {
		unlockedAchievements = await checkAchievements(user.id, {
			type: "savings_goal",
		});
	}

	return Response.json({ goal: updatedGoal, unlockedAchievements });
}

export async function DELETE(request: Request) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return Response.json({ error: "Goal ID is required" }, { status: 400 });
	}

	// Verify ownership
	const goal = await prisma.savingsGoal.findUnique({
		where: { id },
	});

	if (!goal || goal.userId !== user.id) {
		return Response.json({ error: "Goal not found" }, { status: 404 });
	}

	const deleted = await prisma.savingsGoal.update({
		where: { id },
		data: { deletedAt: new Date() },
	});

    const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.emailAddresses[0].emailAddress.split("@")[0];
    if (deleted.workspaceId) {
        await logActivity({
            workspaceId: deleted.workspaceId,
            userId: user.id,
            type: "SAVINGS_GOAL_DELETED",
            description: `${userName} deleted savings goal: ${deleted.name}`,
            metadata: { userName, name: deleted.name }
        });
    }

	return Response.json({ success: true });
}

