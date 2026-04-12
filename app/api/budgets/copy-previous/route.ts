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

  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return Response.json({ error: "No active workspace found" }, { status: 400 });
  }

  if (workspace.role === "VIEWER") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();

  const bodySchema = z.object({
    targetMonth: z.number().min(0).max(11),
    targetYear: z.number(),
  });

  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(parsedBody.error, { status: 400 });
  }

  const { targetMonth, targetYear } = parsedBody.data;

  // Calculate previous month
  let previousMonth = targetMonth - 1;
  let previousYear = targetYear;

  if (previousMonth < 0) {
    previousMonth = 11;
    previousYear = targetYear - 1;
  }

  // Check if target month already has active budgets
  const existingBudgets = await prisma.budget.findMany({
    where: {
      workspaceId: workspace.id,
      month: targetMonth,
      year: targetYear,
      deletedAt: null,
    },
  });

  if (existingBudgets.length > 0) {
    return Response.json(
      {
        error:
          "Target month already has budgets. Delete them first or edit individually.",
      },
      { status: 400 },
    );
  }

  // Get previous month's active budgets
  const previousBudgets = await prisma.budget.findMany({
    where: {
      workspaceId: workspace.id,
      month: previousMonth,
      year: previousYear,
      deletedAt: null,
    },
  });

  if (previousBudgets.length === 0) {
    return Response.json(
      { error: "No budgets found in the previous month to copy." },
      { status: 404 },
    );
  }

  // Copy budgets to target month using upsert to bypass soft-delete conflicts
  const transactions = previousBudgets.map((budget) =>
    prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId: user.id,
          category: budget.category,
          month: targetMonth,
          year: targetYear,
        },
      },
      update: {
        amount: budget.amount,
        categoryIcon: budget.categoryIcon,
        workspaceId: workspace.id,
        deletedAt: null, // restore if soft-deleted previously
      },
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        category: budget.category,
        categoryIcon: budget.categoryIcon,
        amount: budget.amount,
        month: targetMonth,
        year: targetYear,
      },
    })
  );

  await prisma.$transaction(transactions);

  return Response.json(
    {
      success: true,
      count: previousBudgets.length,
      message: `Successfully copied ${previousBudgets.length} budget(s) from previous month.`,
    },
    { status: 201 },
  );
}
