import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
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

  // Check if target month already has budgets
  const existingBudgets = await prisma.budget.findMany({
    where: {
      userId: user.id,
      month: targetMonth,
      year: targetYear,
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

  // Get previous month's budgets
  const previousBudgets = await prisma.budget.findMany({
    where: {
      userId: user.id,
      month: previousMonth,
      year: previousYear,
    },
  });

  if (previousBudgets.length === 0) {
    return Response.json(
      { error: "No budgets found in the previous month to copy." },
      { status: 404 },
    );
  }

  // Copy budgets to target month
  const newBudgets = await prisma.budget.createMany({
    data: previousBudgets.map((budget) => ({
      userId: user.id,
      category: budget.category,
      categoryIcon: budget.categoryIcon,
      amount: budget.amount,
      month: targetMonth,
      year: targetYear,
    })),
  });

  return Response.json(
    {
      success: true,
      count: newBudgets.count,
      message: `Successfully copied ${newBudgets.count} budget(s) from previous month.`,
    },
    { status: 201 },
  );
}
