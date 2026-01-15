import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get previous month
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Get current month transactions by category
  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const currentMonthEnd = new Date(
    currentYear,
    currentMonth + 1,
    0,
    23,
    59,
    59
  );

  const currentTransactions = await prisma.transaction.groupBy({
    by: ["category", "categoryIcon"],
    where: {
      userId: user.id,
      type: "expense",
      date: {
        gte: currentMonthStart,
        lte: currentMonthEnd,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Get previous month transactions by category
  const previousMonthStart = new Date(previousYear, previousMonth, 1);
  const previousMonthEnd = new Date(
    previousYear,
    previousMonth + 1,
    0,
    23,
    59,
    59
  );

  const previousTransactions = await prisma.transaction.groupBy({
    by: ["category", "categoryIcon"],
    where: {
      userId: user.id,
      type: "expense",
      date: {
        gte: previousMonthStart,
        lte: previousMonthEnd,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Create map of previous month spending
  const previousMap = new Map(
    previousTransactions.map((t) => [t.category, t._sum.amount || 0])
  );

  // Calculate trends
  const trends = currentTransactions.map((current) => {
    const currentAmount = current._sum.amount || 0;
    const previousAmount = previousMap.get(current.category) || 0;
    const change = currentAmount - previousAmount;
    const changePercent =
      previousAmount > 0 ? (change / previousAmount) * 100 : 100;

    return {
      category: current.category,
      categoryIcon: current.categoryIcon,
      currentMonth: currentAmount,
      previousMonth: previousAmount,
      change,
      changePercent,
    };
  });

  // Sort by absolute change percentage (most significant first)
  trends.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  return Response.json(trends);
}
