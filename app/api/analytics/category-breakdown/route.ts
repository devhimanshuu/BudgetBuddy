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
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type") || "expense";

  const querySchema = z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(["income", "expense"]),
  });

  const queryParams = querySchema.safeParse({ from, to, type });

  if (!queryParams.success) {
    return Response.json(queryParams.error, { status: 400 });
  }

  const transactions = await prisma.transaction.groupBy({
    by: ["category", "categoryIcon"],
    where: {
      userId: user.id,
      type: queryParams.data.type,
      date: {
        gte: new Date(queryParams.data.from),
        lte: new Date(queryParams.data.to),
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

  // If no transactions found, return empty array
  if (transactions.length === 0) {
    return Response.json([]);
  }

  const categoryBreakdown = transactions.map((transaction) => ({
    category: transaction.category,
    categoryIcon: transaction.categoryIcon,
    amount: transaction._sum.amount || 0,
  }));

  return Response.json(categoryBreakdown);
}
