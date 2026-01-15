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
  const includeCompleted = searchParams.get("includeCompleted") === "true";

  const goals = await prisma.savingsGoal.findMany({
    where: {
      userId: user.id,
      ...(includeCompleted ? {} : { isCompleted: false }),
    },
    orderBy: [{ isCompleted: "asc" }, { targetDate: "asc" }],
  });

  return Response.json(goals);
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const body = await request.json();

  const bodySchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    targetAmount: z.number().positive(),
    currentAmount: z.number().min(0).optional(),
    targetDate: z.string().datetime(),
    category: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
  });

  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(parsedBody.error, { status: 400 });
  }

  const goal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: parsedBody.data.name,
      description: parsedBody.data.description,
      targetAmount: parsedBody.data.targetAmount,
      currentAmount: parsedBody.data.currentAmount || 0,
      targetDate: new Date(parsedBody.data.targetDate),
      category: parsedBody.data.category || "General",
      icon: parsedBody.data.icon || "🎯",
      color: parsedBody.data.color || "#3b82f6",
    },
  });

  return Response.json(goal, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const body = await request.json();

  const bodySchema = z.object({
    id: z.string(),
    currentAmount: z.number().min(0).optional(),
    isCompleted: z.boolean().optional(),
  });

  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(parsedBody.error, { status: 400 });
  }

  // Verify ownership
  const goal = await prisma.savingsGoal.findUnique({
    where: { id: parsedBody.data.id },
  });

  if (!goal || goal.userId !== user.id) {
    return Response.json({ error: "Goal not found" }, { status: 404 });
  }

  const updatedGoal = await prisma.savingsGoal.update({
    where: { id: parsedBody.data.id },
    data: {
      currentAmount: parsedBody.data.currentAmount,
      isCompleted: parsedBody.data.isCompleted,
    },
  });

  return Response.json(updatedGoal);
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Goal ID is required" }, { status: 400 });
  }

  // Verify ownership
  const goal = await prisma.savingsGoal.findUnique({
    where: { id },
  });

  if (!goal || goal.userId !== user.id) {
    return Response.json({ error: "Goal not found" }, { status: 404 });
  }

  await prisma.savingsGoal.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
