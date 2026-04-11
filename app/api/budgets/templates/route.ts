import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(user.id);
  const workspaceId = workspace?.id;

  const templates = await prisma.budgetTemplate.findMany({
    where: {
      OR: [
        { isSystem: true }, // Default templates
        {
          ...(workspaceId ? { workspaceId } : { userId: user.id }),
          deletedAt: null,
        },
      ],
    },
    include: {
      entries: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json(templates);
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace)
    return Response.json({ error: "No active workspace" }, { status: 400 });
  if (workspace.role === "VIEWER")
    return Response.json(
      { error: "Viewers cannot create templates" },
      { status: 403 },
    );

  const body = await request.json();

  const bodySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    month: z.number().min(0).max(11),
    year: z.number(),
  });

  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(parsedBody.error, { status: 400 });
  }

  const { name, description, month, year } = parsedBody.data;

  // Fetch current budgets for that month to save as template
  const budgets = await prisma.budget.findMany({
    where: {
      ...(workspace.id ? { workspaceId: workspace.id } : { userId: user.id }),
      month,
      year,
      deletedAt: null,
    },
  });

  if (budgets.length === 0) {
    return Response.json({ error: "No budgets found for the selected month to save as template" }, { status: 400 });
  }

  const template = await prisma.budgetTemplate.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      name,
      description,
      entries: {
        create: budgets.map((b) => ({
          category: b.category,
          categoryIcon: b.categoryIcon,
          amount: b.amount,
        })),
      },
    },
    include: {
      entries: true,
    },
  });

  return Response.json(template, { status: 201 });
}
