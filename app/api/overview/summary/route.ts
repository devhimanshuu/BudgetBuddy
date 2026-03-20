import prisma from "@/lib/prisma";
import { TransactionType } from "@/lib/type";
import { OverviewQuerySchema } from "@/schema/overview";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace(user.id);
  const workspaceId = workspace?.id;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const queryParams = OverviewQuerySchema.safeParse({ from, to });
  if (!queryParams.success) return Response.json({ error: queryParams.error.message }, { status: 400 });

  const where = {
    ...(workspaceId ? { workspaceId } : { userId: user.id }),
    date: { gte: queryParams.data.from, lte: queryParams.data.to },
  };

  const [totals, categoriesStats] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where,
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["type", "category", "categoryIcon"],
      where,
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  const expense = totals.find((t) => t.type === "expense")?._sum.amount;
  const income = totals.find((t) => t.type === "income")?._sum.amount;
  const balance = {
    expense: expense != null ? Number(expense) : 0,
    income: income != null ? Number(income) : 0,
  };

  const categories = categoriesStats.map((stat) => ({
    ...stat,
    _sum: { amount: stat._sum.amount ?? 0 },
  }));

  return Response.json({ balance, categories });
}
