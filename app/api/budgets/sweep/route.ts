import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getActiveWorkspace, getMemberRestrictions } from "@/lib/workspaces";
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
        const restrictions = await getMemberRestrictions(user.id, workspaceId || "");

        // 1. Get all budgets for the month
        const budgets = await prisma.budget.findMany({
            where: {
                workspaceId: workspaceId || null,
                month: month,
                year: year,
                ...(restrictions?.allowedCategories ? { category: { in: restrictions.allowedCategories } } : {}),
            },
        });

        // 2. Get actual spending for each category in the month to calculate true leftovers
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        const transactions = await prisma.transaction.findMany({
            where: {
                workspaceId: workspaceId || null,
                type: { in: ["expense", "investment"] },
                ...(restrictions?.allowedCategories ? { category: { in: restrictions.allowedCategories } } : {}),
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                splits: true,
            },
        });

        // 3. Calculate spending per category (including previous sweeps via splits)
        const spendingByCategory: { [key: string]: number } = {};
        transactions.forEach((transaction) => {
            if (transaction.splits && transaction.splits.length > 0) {
                transaction.splits.forEach((split) => {
                    spendingByCategory[split.category] = (spendingByCategory[split.category] || 0) + split.amount;
                });
            } else {
                spendingByCategory[transaction.category] = (spendingByCategory[transaction.category] || 0) + transaction.amount;
            }
        });

        // 4. Calculate splits for the sweep
        const splitsData: { category: string, categoryIcon: string, amount: number }[] = [];
        let totalLeftover = 0;

        for (const budget of budgets) {
            const spent = spendingByCategory[budget.category] || 0;
            const remaining = Math.max(0, budget.amount - spent);
            
            if (remaining > 0.01) { // Ignore dust
                totalLeftover += remaining;
                splitsData.push({
                    category: budget.category,
                    categoryIcon: budget.categoryIcon,
                    amount: remaining,
                });
            }
        }

        if (totalLeftover <= 0) {
            return Response.json({ error: "No funds left to sweep" }, { status: 400 });
        }

        // Round total to 2 decimal places
        const finalSweepAmount = Math.round(totalLeftover * 100) / 100;

        await prisma.$transaction(async (tx) => {
            // Determine the date for the sweep transaction
            const now = new Date();
            let sweepDate = now;
            if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
                 sweepDate = new Date(year, month + 1, 0, 23, 59, 59);
            }

            const sweepDay = sweepDate.getDate();
            const sweepMonth = sweepDate.getMonth();
            const sweepYear = sweepDate.getFullYear();

            // 1. Create a transaction with splits representing the sweep out of categories
            await tx.transaction.create({
                data: {
                    userId: user.id,
                    workspaceId: workspaceId,
                    amount: finalSweepAmount,
                    date: sweepDate,
                    description: `End of Month Sweep (${month + 1}/${year}) -> ${goal.name}`,
                    type: "expense",
                    category: goal.category || "Savings",
                    categoryIcon: goal.icon || "🎯",
                    splits: {
                        create: splitsData.map(s => ({
                            category: s.category,
                            categoryIcon: s.categoryIcon,
                            amount: Math.round(s.amount * 100) / 100,
                            percentage: (s.amount / totalLeftover) * 100
                        }))
                    }
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
                    amount: finalSweepAmount,
                    createdAt: sweepDate,
                }
            });

            // 3. Update goal balance
            const newAmount = goal.currentAmount + finalSweepAmount;
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
                    expense: finalSweepAmount,
                    income: 0,
                },
                update: {
                    expense: {
                        increment: finalSweepAmount,
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
                    expense: finalSweepAmount,
                    income: 0,
                },
                update: {
                    expense: {
                        increment: finalSweepAmount,
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
