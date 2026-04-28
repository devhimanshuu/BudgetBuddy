"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";
import { GetFormatterForCurrency } from "@/lib/helper";

export async function ProposeBudget({
  category,
  categoryIcon,
  amount,
  month,
  year,
  notes,
}: {
  category: string;
  categoryIcon: string;
  amount: number;
  month: number;
  year: number;
  notes?: string;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) throw new Error("No active workspace");

  const userName = user.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user.emailAddresses[0].emailAddress.split("@")[0];

  const proposal = await prisma.budgetProposal.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      userName,
      category,
      categoryIcon,
      amount,
      month,
      year,
      notes,
    },
  });

  const formatter = GetFormatterForCurrency(workspace.currency);

  await logActivity({
    workspaceId: workspace.id,
    userId: user.id,
    type: "BUDGET_PROPOSED",
    description: `${userName} proposed a budget of ${formatter.format(amount)} for ${category}`,
    metadata: { category, amount, month, year },
  });

  revalidatePath("/budgets");
  return proposal;
}

export async function GetBudgetProposals(month: number, year: number) {
  const user = await currentUser();
  if (!user) return [];

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return [];

  return await prisma.budgetProposal.findMany({
    where: {
      workspaceId: workspace.id,
      month,
      year,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function FinalizeBudgetProposal(proposalId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace || workspace.role !== "ADMIN") {
    throw new Error("Only admins can finalize budget proposals");
  }

  const proposal = await prisma.budgetProposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) throw new Error("Proposal not found");

  // Update or create the actual budget
  // We use workspace.ownerId to anchor the budget so it's consistent for all members
  await prisma.$transaction([
    prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId: workspace.ownerId, 
          category: proposal.category,
          month: proposal.month,
          year: proposal.year,
        },
      },
      update: {
        amount: proposal.amount,
        categoryIcon: proposal.categoryIcon,
        workspaceId: workspace.id,
      },
      create: {
        userId: workspace.ownerId,
        workspaceId: workspace.id,
        category: proposal.category,
        categoryIcon: proposal.categoryIcon,
        amount: proposal.amount,
        month: proposal.month,
        year: proposal.year,
      },
    }),
    prisma.budgetProposal.update({
      where: { id: proposalId },
      data: { status: "APPROVED" },
    }),
  ]);

  const formatter = GetFormatterForCurrency(workspace.currency);

  await logActivity({
    workspaceId: workspace.id,
    userId: user.id,
    type: "BUDGET_FINALIZED",
    description: `Finalized budget proposal for ${proposal.category} (${formatter.format(proposal.amount)})`,
    metadata: { proposalId, amount: proposal.amount },
  });

  revalidatePath("/budgets");
  return { success: true };
}

export async function RejectBudgetProposal(proposalId: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");
  
    const workspace = await getActiveWorkspace(user.id);
    if (!workspace || workspace.role !== "ADMIN") {
      throw new Error("Only admins can reject budget proposals");
    }
  
    await prisma.budgetProposal.update({
      where: { id: proposalId },
      data: { status: "REJECTED" },
    });
  
    revalidatePath("/budgets");
    return { success: true };
}
