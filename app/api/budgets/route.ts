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
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const querySchema = z.object({
    month: z.string(),
    year: z.string(),
  });

  const queryParams = querySchema.safeParse({ month, year });

  if (!queryParams.success) {
    return Response.json(queryParams.error, { status: 400 });
  }

  const budgets = await prisma.budget.findMany({
    where: {
      userId: user.id,
      month: parseInt(queryParams.data.month),
      year: parseInt(queryParams.data.year),
    },
    orderBy: {
      category: "asc",
    },
  });

  return Response.json(budgets);
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const body = await request.json();

  const bodySchema = z.object({
    category: z.string(),
    categoryIcon: z.string(),
    amount: z.number().positive(),
    month: z.number().min(0).max(11),
    year: z.number(),
  });

  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(parsedBody.error, { status: 400 });
  }

  const { category, categoryIcon, amount, month, year } = parsedBody.data;

  // Upsert budget (create or update if exists)
  const budget = await prisma.budget.upsert({
    where: {
      userId_category_month_year: {
        userId: user.id,
        category,
        month,
        year,
      },
    },
    update: {
      amount,
      categoryIcon,
    },
    create: {
      userId: user.id,
      category,
      categoryIcon,
      amount,
      month,
      year,
    },
  });

  return Response.json(budget, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Budget ID is required" }, { status: 400 });
  }

  // Verify ownership before deleting
  const budget = await prisma.budget.findUnique({
    where: { id },
  });

  if (!budget || budget.userId !== user.id) {
    return Response.json({ error: "Budget not found" }, { status: 404 });
  }

  await prisma.budget.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
