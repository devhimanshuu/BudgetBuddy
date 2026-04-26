"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";

export async function GetSettlements() {
  const user = await currentUser();
  if (!user) return { owedToMe: [], iOwe: [] };

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return { owedToMe: [], iOwe: [] };

  // Money owed to the current user (where current user is the creditor/payer)
  const owedToMe = await prisma.billSplit.findMany({
    where: {
      debtorId: { not: user.id },
      isPaid: false,
      transaction: {
        workspaceId: workspace.id,
        userId: user.id, // Payer was current user
      },
    },
    include: {
      transaction: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Money the current user owes to others
  const iOwe = await prisma.billSplit.findMany({
    where: {
      debtorId: user.id,
      isPaid: false,
      transaction: {
        workspaceId: workspace.id,
        userId: { not: user.id }, // Payer was someone else
      },
    },
    include: {
      transaction: {
        select: {
          id: true,
          description: true,
          userId: true, // Payer ID
          amount: true,
          date: true,
          category: true,
        }
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    owedToMe,
    iOwe,
  };
}

export async function MarkAsPaid(splitId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const split = await prisma.billSplit.findUnique({
    where: { id: splitId },
    include: { transaction: true },
  });

  if (!split) throw new Error("Split not found");

  // Only the creditor (payer) can mark it as paid
  if (split.transaction.userId !== user.id) {
    throw new Error("Only the person who is owed can mark this as paid");
  }

  await prisma.billSplit.update({
    where: { id: splitId },
    data: {
      isPaid: true,
      paidAt: new Date(),
    },
  });

  const workspace = await getActiveWorkspace(user.id);
  if (workspace) {
    const userName = user.firstName || user.emailAddresses[0].emailAddress.split("@")[0];
    await logActivity({
      workspaceId: workspace.id,
      userId: user.id,
      type: "SETTLEMENT_PAID",
      description: `${userName} marked a debt of $${split.amount.toFixed(2)} from ${split.debtorName} as settled`,
      metadata: { splitId, amount: split.amount, debtorName: split.debtorName },
    });
  }

  return { success: true };
}
