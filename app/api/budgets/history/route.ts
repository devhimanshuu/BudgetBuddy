import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const monthsBack = searchParams.get("monthsBack") || "6";

  const querySchema = z.object({
    category: z.string(),
    monthsBack: z.string(),
  });

  const queryParams = querySchema.safeParse({ category, monthsBack });

  if (!queryParams.success) {
    return Response.json(queryParams.error, { status: 400 });
  }

  const months = parseInt(queryParams.data.monthsBack);
  const now = new Date();
  const historicalData = [];

  // Get spending for each of the last N months
  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = targetDate.getMonth();
    const year = targetDate.getFullYear();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        category: queryParams.data.category,
        type: "expense",
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

    historicalData.push({
      month: targetDate.toLocaleDateString("en-US", { month: "short" }),
      year: year,
      spent: totalSpent,
    });
  }

  return Response.json(historicalData);
}
