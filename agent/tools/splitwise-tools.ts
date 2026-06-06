import prisma from "@/lib/prisma";

export interface SplitwiseFriend {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  updated_at: string;
  balance: number; // Positive means they owe user, negative means user owes them
}

/**
 * Fetch outstanding balances from Splitwise API
 */
export async function getSplitwiseFriends(userId: string): Promise<SplitwiseFriend[]> {
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!userSettings?.splitwiseToken) {
    throw new Error("Splitwise account not linked. Please link your account in BudgetBuddy Settings.");
  }

  const response = await fetch("https://secure.splitwise.com/api/v3.0/get_friends", {
    headers: {
      Authorization: `Bearer ${userSettings.splitwiseToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Splitwise API error: ${response.statusText}`);
  }

  const data = await response.json();
  const friends = data.friends || [];

  return friends.map((friend: any) => {
    // Calculate total net balance for this friend
    let netBalance = 0;
    if (friend.balances && friend.balances.length > 0) {
      for (const b of friend.balances) {
        netBalance += parseFloat(b.amount);
      }
    }

    return {
      id: friend.id,
      first_name: friend.first_name,
      last_name: friend.last_name,
      email: friend.email,
      updated_at: friend.updated_at,
      balance: netBalance,
    };
  });
}
