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

  // Get current month start and end
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  // Get transactions grouped by category
  const categories = await prisma.transaction.groupBy({
    by: ["category", "categoryIcon"],
    where: {
      userId: user.id,
      type: "expense",
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      _sum: {
        amount: "desc",
      },
    },
  });

  // Calculate total for percentages
  const total = categories.reduce(
    (sum, cat) => sum + (cat._sum.amount || 0),
    0
  );

  // Format response
  const formattedCategories = categories.map((cat) => ({
    category: cat.category,
    categoryIcon: cat.categoryIcon,
    amount: cat._sum.amount || 0,
    percentage: total > 0 ? ((cat._sum.amount || 0) / total) * 100 : 0,
  }));

  return Response.json(formattedCategories);
}
