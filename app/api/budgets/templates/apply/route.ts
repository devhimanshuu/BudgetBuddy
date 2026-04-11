import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace, logActivity } from "@/lib/workspaces";

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
      { error: "Viewers cannot apply templates" },
      { status: 403 },
    );

  const body = await request.json();

  const bodySchema = z.object({
    templateId: z.string().uuid(),
    month: z.number().min(0).max(11),
    year: z.number(),
  });

  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(parsedBody.error, { status: 400 });
  }

  const { templateId, month, year } = parsedBody.data;

  const template = await prisma.budgetTemplate.findUnique({
    where: { id: templateId },
    include: { entries: true },
  });

  if (!template || (template.workspaceId !== workspace.id && !template.isSystem && template.userId !== user.id)) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }

  // Create or Update budgets based on template entries
  const budgetPromises = template.entries.map((entry) =>
    prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId: user.id,
          category: entry.category,
          month,
          year,
        },
      },
      update: {
        amount: entry.amount,
        categoryIcon: entry.categoryIcon,
        workspaceId: workspace.id,
        deletedAt: null, // Reactivate if it was deleted
      },
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        category: entry.category,
        categoryIcon: entry.categoryIcon,
        amount: entry.amount,
        month,
        year,
      },
    })
  );

  await Promise.all(budgetPromises);

  const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.emailAddresses[0].emailAddress.split("@")[0];
  await logActivity({
    workspaceId: workspace.id,
    userId: user.id,
    type: "BUDGET_TEMPLATE_APPLIED",
    description: `${userName} applied template '${template.name}' to ${month + 1}/${year}`,
    metadata: { userName, templateName: template.name, month, year }
  });

  return Response.json({ message: "Template applied successfully" });
}
