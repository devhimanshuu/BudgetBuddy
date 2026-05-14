"use server";

import prisma from "@/lib/prisma";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { GetFormatterForCurrency } from "@/lib/helper";

export async function GetBillSplits() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const workspace = await getActiveWorkspace();
    if (!workspace) throw new Error("No active workspace found");

    // Fetch all bill splits in this workspace
    // We want splits where:
    // 1. The user is the payer (others owe the user)
    // 2. The user is the debtor (user owes others)
    const splits = await prisma.billSplit.findMany({
        where: {
            transaction: {
                workspaceId: workspace.id,
            },
            OR: [
                { debtorId: user.id },
                { transaction: { userId: user.id } }
            ]
        },
        include: {
            transaction: {
                select: {
                    description: true,
                    amount: true,
                    date: true,
                    userId: true,
                    category: true,
                    categoryIcon: true,
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return splits;
}

export async function SettleBillSplit(splitId: string) {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const workspace = await getActiveWorkspace();
    if (!workspace) throw new Error("No active workspace found");

    const split = await prisma.billSplit.findUnique({
        where: { id: splitId },
        include: {
            transaction: true
        }
    });

    if (!split) throw new Error("Split not found");

    // Only the payer or the debtor can mark as paid?
    // Usually the payer marks it as paid once they receive the money
    if (split.transaction.userId !== user.id && split.debtorId !== user.id) {
        throw new Error("Unauthorized to settle this bill");
    }

    const updatedSplit = await prisma.billSplit.update({
        where: { id: splitId },
        data: {
            isPaid: true,
            paidAt: new Date()
        }
    });

    const formatter = GetFormatterForCurrency(workspace.currency);
    const amount = formatter.format(split.amount);

    // Log activity
    await logActivity({
        workspaceId: workspace.id,
        userId: user.id,
        type: "BILL_SETTLED",
        description: `${user.firstName || "User"} settled a bill split of ${amount} for ${split.transaction.description || split.transaction.category}`,
        metadata: {
            splitId,
            amount: split.amount,
            description: split.transaction.description
        }
    });

    return { success: true };
}
