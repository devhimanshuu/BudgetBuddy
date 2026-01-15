import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "income" | "expense" | null;

  if (!type || (type !== "income" && type !== "expense")) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  // Get recent transactions to find frequently used categories
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      type,
    },
    select: {
      category: true,
      categoryIcon: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Last 50 transactions
  });

  // Count category usage
  const categoryCount = new Map<string, { count: number; icon: string }>();

  recentTransactions.forEach((transaction) => {
    const existing = categoryCount.get(transaction.category);
    if (existing) {
      existing.count++;
    } else {
      categoryCount.set(transaction.category, {
        count: 1,
        icon: transaction.categoryIcon,
      });
    }
  });

  // Convert to array and sort by usage count
  const recentCategories = Array.from(categoryCount.entries())
    .map(([name, data]) => ({
      name,
      icon: data.icon,
      count: data.count,
      type,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 most used

  return Response.json(recentCategories);
}
