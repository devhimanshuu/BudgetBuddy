import prisma from "@/lib/prisma";

export async function pushExpenseToSplitwise(transactionId: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { billSplits: true }
    });

    if (!transaction) return;

    // Only push expenses to Splitwise (Income splits are tracked locally only)
    if (transaction.type !== "expense") return;

    // Filter out non-splitwise splits (e.g. workspace members with UUIDs)
    const splitwiseSplits = transaction.billSplits.filter(s => /^\d+$/.test(s.debtorId));
    if (splitwiseSplits.length === 0) return;

    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: transaction.userId },
    });

    if (!userSettings?.splitwiseToken) return;

    // Fetch current user from splitwise to get their ID
    const currentUserRes = await fetch("https://secure.splitwise.com/api/v3.0/get_current_user", {
      headers: { "Authorization": `Bearer ${userSettings.splitwiseToken}` }
    });
    
    if (!currentUserRes.ok) {
      console.error("Failed to fetch current user from Splitwise");
      return;
    }
    
    const currentUserData = await currentUserRes.json();
    const splitwiseUserId = currentUserData.user.id;

    // Create a payload for Splitwise
    const payload: any = {
      cost: transaction.amount,
      description: transaction.description || transaction.category,
      date: transaction.date.toISOString(),
      // The current user paid for everything
      "users__0__user_id": splitwiseUserId,
      "users__0__paid_share": transaction.amount,
    };

    // Calculate how much the user is owed (sum of what friends owe)
    let totalOwed = 0;
    
    // Add all friends to the expense
    splitwiseSplits.forEach((split, index) => {
      // Offset by 1 because index 0 is the current user
      const splitwiseIndex = index + 1;
      payload[`users__${splitwiseIndex}__user_id`] = parseInt(split.debtorId);
      payload[`users__${splitwiseIndex}__owed_share`] = split.amount;
      payload[`users__${splitwiseIndex}__paid_share`] = 0;
      totalOwed += split.amount;
    });

    // The current user owes the remainder (total amount - what others owe)
    payload["users__0__owed_share"] = transaction.amount - totalOwed;

    // Make request to Splitwise
    const response = await fetch("https://secure.splitwise.com/api/v3.0/create_expense", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${userSettings.splitwiseToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Splitwise Sync Error:", errorData);
    } else {
      console.log(`✅ Synced transaction ${transactionId} to Splitwise for user ${transaction.userId}`);
    }
  } catch (error) {
    console.error("❌ Failed to sync transaction to Splitwise:", error);
  }
}
