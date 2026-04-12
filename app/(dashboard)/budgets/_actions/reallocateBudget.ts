"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";

export async function ReallocateBudget({
  sourceCategory,
  targetCategory,
  amount,
  month,
  year,
}: {
  sourceCategory: string;
  targetCategory: string;
  amount: number;
  month: number;
  year: number;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) {
    throw new Error("No active workspace");
  }

  if (workspace.role === "VIEWER") {
    throw new Error("Viewers cannot update budgets");
  }

  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Find both budgets
  const sourceBudget = await prisma.budget.findFirst({
    where: {
      userId: user.id,
      category: sourceCategory,
      month,
      year,
    },
  });

  const targetBudget = await prisma.budget.findFirst({
    where: {
      userId: user.id,
      category: targetCategory,
      month,
      year,
    },
  });

  if (!sourceBudget || !targetBudget) {
    throw new Error("One or both budgets not found");
  }

  // Transaction to update both
  await prisma.$transaction([
    prisma.budget.update({
      where: {
        userId_category_month_year: {
          userId: user.id,
          category: sourceCategory,
          month,
          year,
        },
      },
      data: {
        amount: sourceBudget.amount - amount,
      },
    }),
    prisma.budget.update({
      where: {
        userId_category_month_year: {
          userId: user.id,
          category: targetCategory,
          month,
          year,
        },
      },
      data: {
        amount: targetBudget.amount + amount,
      },
    }),
  ]);

  const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.emailAddresses[0].emailAddress.split("@")[0];

  if (workspace.id) {
    await logActivity({
      workspaceId: workspace.id,
      userId: user.id,
      type: "BUDGET_REALLOCATED",
      description: `${userName} reallocated ${amount} from ${sourceCategory} to ${targetCategory}`,
      metadata: { userName, sourceCategory, targetCategory, amount, month, year },
    });
  }

  return { success: true };
}
