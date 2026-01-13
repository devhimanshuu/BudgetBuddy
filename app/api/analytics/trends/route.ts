import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDaysInMonth } from "date-fns";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const querySchema = z.object({
    from: z.string(),
    to: z.string(),
  });

  const queryParams = querySchema.safeParse({ from, to });

  if (!queryParams.success) {
    return Response.json(queryParams.error, { status: 400 });
  }

  const fromDate = new Date(queryParams.data.from);
  const toDate = new Date(queryParams.data.to);

  // Get daily aggregated data
  const stats = await prisma.monthlyHistory.findMany({
    where: {
      userId: user.id,
      year: {
        gte: fromDate.getFullYear(),
        lte: toDate.getFullYear(),
      },
      month: {
        gte: fromDate.getMonth(),
        lte: toDate.getMonth(),
      },
    },
    orderBy: [{ year: "asc" }, { month: "asc" }, { day: "asc" }],
  });

  // Filter by exact date range
  const filteredStats = stats.filter((stat) => {
    const statDate = new Date(stat.year, stat.month, stat.day);
    return statDate >= fromDate && statDate <= toDate;
  });

  const trends = filteredStats.map((stat) => ({
    date: new Date(stat.year, stat.month, stat.day).toISOString(),
    income: stat.income,
    expense: stat.expense,
    balance: stat.income - stat.expense,
  }));

  return Response.json(trends);
}
