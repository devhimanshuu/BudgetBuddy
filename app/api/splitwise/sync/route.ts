import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { DateToUTCDate } from "@/lib/helper";

export async function POST(req: Request) {
  try {
    // 1. Determine which users to sync
    const url = new URL(req.url);
    const cronAuth = req.headers.get("Authorization");
    const isCron = cronAuth === `Bearer ${process.env.CRON_SECRET}`;

    let usersToSync = [];

    if (isCron) {
      // Fetch all users with Splitwise connected
      usersToSync = await prisma.userSettings.findMany({
        where: { splitwiseToken: { not: null } },
      });
    } else {
      // Manual trigger from frontend
      const user = await currentUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: user.id },
      });

      if (!userSettings?.splitwiseToken) {
        return NextResponse.json({ error: "Splitwise not connected" }, { status: 400 });
      }
      usersToSync = [userSettings];
    }

    let syncedCount = 0;

    // 2. Process each user
    for (const settings of usersToSync) {
      // Get current user ID from Splitwise
      const currentUserRes = await fetch("https://secure.splitwise.com/api/v3.0/get_current_user", {
        headers: { "Authorization": `Bearer ${settings.splitwiseToken}` }
      });
      if (!currentUserRes.ok) continue;
      const currentUserData = await currentUserRes.json();
      const splitwiseUserId = currentUserData.user.id;

      // Fetch expenses updated after last sync, or last 30 days if no sync
      let updatedAfterStr = "";
      if (settings.splitwiseLastSync) {
        updatedAfterStr = `&updated_after=${settings.splitwiseLastSync.toISOString()}`;
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        updatedAfterStr = `&updated_after=${thirtyDaysAgo.toISOString()}`;
      }

      const expensesRes = await fetch(`https://secure.splitwise.com/api/v3.0/get_expenses?limit=100${updatedAfterStr}`, {
        headers: { "Authorization": `Bearer ${settings.splitwiseToken}` }
      });

      if (!expensesRes.ok) continue;
      const data = await expensesRes.json();

      for (const expense of data.expenses) {
        // We only care about payments (settlements) where the user RECEIVED money
        // OR non-payments where the user received money (rare, but possible)
        if (expense.payment && !expense.deleted_at) {
          const userShare = expense.users.find((u: any) => u.user_id === splitwiseUserId);
          
          // If the user's owed_share is negative in a payment, it means they received money
          // Example: John paid User $20. John's paid_share=20, owed_share=20. User's paid_share=0, owed_share=-20.
          if (userShare && parseFloat(userShare.owed_share) < 0) {
            const amountReceived = Math.abs(parseFloat(userShare.owed_share));
            
            // Look up who paid them (the person with paid_share > 0)
            const payer = expense.users.find((u: any) => parseFloat(u.paid_share) > 0);
            const payerName = payer ? `${payer.user.first_name} ${payer.user.last_name || ""}`.trim() : "A friend";

            // Check if we already logged this payment
            const externalId = `splitwise_${expense.id}`;
            const existing = await prisma.transaction.findUnique({
              where: { externalId }
            });

            if (!existing) {
              // We need an active workspace for this user to log the transaction
              const membership = await prisma.workspaceMember.findFirst({
                where: { userId: settings.userId, deletedAt: null }
              });

              if (membership) {
                // Log it as Income!
                await prisma.transaction.create({
                  data: {
                    userId: settings.userId,
                    workspaceId: membership.workspaceId,
                    amount: amountReceived,
                    description: `Settlement from ${payerName}`,
                    date: DateToUTCDate(new Date(expense.date)),
                    type: "income",
                    category: "Income", // Fallback category
                    categoryIcon: "💰",
                    externalId: externalId,
                  }
                });
                syncedCount++;
              }
            }
          }
        }
      }

      // Update last sync time
      await prisma.userSettings.update({
        where: { userId: settings.userId },
        data: { splitwiseLastSync: new Date() }
      });
    }

    return NextResponse.json({ success: true, syncedCount });
  } catch (error) {
    console.error("Splitwise Sync Error:", error);
    return NextResponse.json({ error: "Failed to sync Splitwise" }, { status: 500 });
  }
}
