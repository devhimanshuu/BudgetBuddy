import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getActiveWorkspace } from "@/lib/workspaces";
import { z } from "zod";

export async function POST(request: Request) {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await getActiveWorkspace();
    const workspaceId = workspace?.id;

    const body = await request.json();
    const schema = z.object({
        month: z.number(),
        year: z.number(),
        goalId: z.string(),
        amount: z.number().positive()
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json(parsed.error, { status: 400 });

    const { month, year, goalId, amount } = parsed.data;

    const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } });
    if (!goal || (goal.userId !== user.id && goal.workspaceId !== workspaceId)) {
        return Response.json({ error: "Goal not found" }, { status: 404 });
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Determine the date for the sweep transaction
            // If we are sweeping a past month, use the last day of that month.
            // If the current date is still in the same month being viewed, use today.
            const now = new Date();
            let sweepDate = now;
            if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
                 sweepDate = new Date(year, month + 1, 0, 23, 59, 59);
            }

            const sweepDay = sweepDate.getDate();
            const sweepMonth = sweepDate.getMonth();
            const sweepYear = sweepDate.getFullYear();

            // 1. Create a transaction of type "expense" to represent the sweep out of general funds
            await tx.transaction.create({
                data: {
                    userId: user.id,
                    workspaceId: workspaceId,
                    amount: amount,
                    date: sweepDate,
                    description: `End of Month Sweep (${month + 1}/${year}) -> ${goal.name}`,
                    type: "expense",
                    category: goal.category || "Savings", // Or specifically point to savings
                    categoryIcon: goal.icon || "🎯",
                }
            });

            // 2. Add goal contribution
            const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.emailAddresses[0].emailAddress.split("@")[0];

            await tx.goalContribution.create({
                data: {
                    goalId,
                    userId: user.id,
                    userName,
                    userImage: user.imageUrl,
                    amount,
                    createdAt: sweepDate,
                }
            });

            // 3. Update goal balance
            const newAmount = goal.currentAmount + amount;
            await tx.savingsGoal.update({
                where: { id: goalId },
                data: {
                    currentAmount: newAmount,
                    isCompleted: newAmount >= goal.targetAmount
                }
            });
            
            // 4. Update monthly history
            await tx.monthlyHistory.upsert({
                where: {
                    day_month_year_userId: {
                        userId: user.id,
                        day: sweepDay,
                        month: sweepMonth,
                        year: sweepYear,
                    },
                },
                create: {
                    userId: user.id,
                    workspaceId,
                    day: sweepDay,
                    month: sweepMonth,
                    year: sweepYear,
                    expense: amount,
                    income: 0,
                },
                update: {
                    expense: {
                        increment: amount,
                    },
                },
            });

            // 5. Update year history
            await tx.yearHistory.upsert({
                where: {
                    month_year_userId: {
                        userId: user.id,
                        month: sweepMonth,
                        year: sweepYear,
                    },
                },
                create: {
                    userId: user.id,
                    workspaceId,
                    month: sweepMonth,
                    year: sweepYear,
                    expense: amount,
                    income: 0,
                },
                update: {
                    expense: {
                        increment: amount,
                    },
                },
            });
        });

        return Response.json({ success: true, message: "Funds swept successfully" });
    } catch (e) {
        console.error("Failed to sweep funds", e);
        return Response.json({ error: "Failed to sweep funds" }, { status: 500 });
    }
}
