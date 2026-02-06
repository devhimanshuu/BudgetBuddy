import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const ImportTransactionSchema = z.object({
  date: z.string().or(z.date()),
  amount: z.number().positive(),
  description: z.string().min(1),
  type: z.enum(["income", "expense"]).default("expense"),
  category: z.string().optional(),
  categoryIcon: z.string().optional(),
  notes: z.string().optional(),
});

const ImportRequestSchema = z.object({
  transactions: z.array(ImportTransactionSchema),
  skipDuplicates: z.boolean().default(true),
});

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  try {
    const body = await request.json();
    const validation = ImportRequestSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: "Invalid request data", details: validation.error },
        { status: 400 }
      );
    }

    const { transactions, skipDuplicates } = validation.data;
    const results = {
      total: transactions.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
    };

    // Get user's categories for validation
    const userCategories = await prisma.category.findMany({
      where: { userId: user.id },
    });

    const categoryMap = new Map(
      userCategories.map((c) => [c.name.toLowerCase(), c])
    );

    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i];

      try {
        // Parse date
        const date = new Date(txn.date);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format");
        }

        // Determine category
        let category = txn.category || "Uncategorized";
        let categoryIcon = txn.categoryIcon || "📦";

        if (txn.category) {
          const existingCategory = categoryMap.get(txn.category.toLowerCase());
          if (existingCategory) {
            category = existingCategory.name;
            categoryIcon = existingCategory.icon;
          } else {
            // Create new category
            const newCategory = await prisma.category.create({
              data: {
                name: txn.category,
                icon: categoryIcon,
                type: txn.type,
                userId: user.id,
              },
            });
            categoryMap.set(txn.category.toLowerCase(), newCategory);
          }
        }

        // Check for duplicates
        if (skipDuplicates) {
          const duplicate = await prisma.transaction.findFirst({
            where: {
              userId: user.id,
              date: {
                gte: new Date(date.setHours(0, 0, 0, 0)),
                lt: new Date(date.setHours(23, 59, 59, 999)),
              },
              amount: txn.amount,
              description: txn.description,
            },
          });

          if (duplicate) {
            results.skipped++;
            continue;
          }
        }

        // Create transaction
        await prisma.transaction.create({
          data: {
            userId: user.id,
            date,
            amount: txn.amount,
            description: txn.description,
            type: txn.type,
            category,
            categoryIcon,
            notes: txn.notes || null,
          },
        });

        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
          data: txn,
        });
      }
    }

    return Response.json(results);
  } catch (error) {
    console.error("Import error:", error);
    return Response.json(
      { error: "Failed to import transactions" },
      { status: 500 }
    );
  }
}
