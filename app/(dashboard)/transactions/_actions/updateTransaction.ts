"use server";

import prisma from "@/lib/prisma";
import {
  CreateTransactionSchema,
  CreateTransactionSchemaType,
} from "@/schema/transaction";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function UpdateTransaction(
  id: string,
  form: CreateTransactionSchemaType,
) {
  const parsedBody = CreateTransactionSchema.safeParse(form);
  if (!parsedBody.success) {
    throw new Error(parsedBody.error.message);
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const {
    amount,
    category,
    date,
    description,
    notes,
    type,
    tags,
    attachments,
    splits,
  } = parsedBody.data;

  const transaction = await prisma.transaction.findUnique({
    where: {
      userId: user.id,
      id,
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      splits: true,
      attachments: true,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const categoryRow = await prisma.category.findFirst({
    where: {
      userId: user.id,
      name: category,
    },
  });

  if (!categoryRow) {
    throw new Error("Category not found");
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        // 0. Create history snapshot before any changes
        await tx.transactionHistory.create({
          data: {
            transactionId: id,
            amount: transaction.amount,
            description: transaction.description,
            notes: transaction.notes,
            date: transaction.date,
            category: transaction.category,
            categoryIcon: transaction.categoryIcon,
            type: transaction.type,
            tags: transaction.tags.map((t) => t.tag.name), // Store tag names for history readability
          },
        });

        // 1. Revert old stats
        const oldDate = transaction.date;
        const oldAmount = transaction.amount;
        const oldType = transaction.type;

        // Use upsert to handle cases where the record might not exist
        await tx.monthlyHistory.upsert({
          where: {
            day_month_year_userId: {
              userId: user.id,
              day: oldDate.getUTCDate(),
              month: oldDate.getUTCMonth(),
              year: oldDate.getUTCFullYear(),
            },
          },
          create: {
            userId: user.id,
            day: oldDate.getUTCDate(),
            month: oldDate.getUTCMonth(),
            year: oldDate.getUTCFullYear(),
            expense: 0,
            income: 0,
          },
          update: {
            ...(oldType === "expense" && {
              expense: { decrement: oldAmount },
            }),
            ...(oldType === "income" && {
              income: { decrement: oldAmount },
            }),
          },
        });

        await tx.yearHistory.upsert({
          where: {
            month_year_userId: {
              userId: user.id,
              month: oldDate.getUTCMonth(),
              year: oldDate.getUTCFullYear(),
            },
          },
          create: {
            userId: user.id,
            month: oldDate.getUTCMonth(),
            year: oldDate.getUTCFullYear(),
            expense: 0,
            income: 0,
          },
          update: {
            ...(oldType === "expense" && {
              expense: { decrement: oldAmount },
            }),
            ...(oldType === "income" && {
              income: { decrement: oldAmount },
            }),
          },
        });

        // 2. Clear existing relations
        await tx.transactionTag.deleteMany({
          where: { transactionId: id },
        });
        await tx.transactionSplit.deleteMany({
          where: { transactionId: id },
        });
        // For attachments, we might want to keep them or update them more smartly,
        // but for now, simple replace is safe if the UI sends all current attachments.
        await tx.attachment.deleteMany({
          where: { transactionId: id },
        });

        // 3. Update Transaction
        await tx.transaction.update({
          where: { id, userId: user.id },
          data: {
            amount,
            date,
            description: description || "",
            notes: notes || null,
            type,
            category: categoryRow.name,
            categoryIcon: categoryRow.icon,
          },
        });

        // 4. Re-create relations
        if (tags && tags.length > 0) {
          await tx.transactionTag.createMany({
            data: tags.map((tagId) => ({
              transactionId: id,
              tagId,
            })),
          });
        }

        if (attachments && attachments.length > 0) {
          await tx.attachment.createMany({
            data: attachments.map((att) => ({
              transactionId: id,
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSize: att.fileSize,
              fileType: att.fileType,
            })),
          });
        }

        if (splits && splits.length > 0) {
          await tx.transactionSplit.createMany({
            data: splits.map((split) => ({
              transactionId: id,
              category: split.category,
              categoryIcon: split.categoryIcon,
              amount: split.amount,
              percentage: split.percentage,
            })),
          });
        }

        // 5. Apply new stats
        await tx.monthlyHistory.upsert({
          where: {
            day_month_year_userId: {
              userId: user.id,
              day: date.getUTCDate(),
              month: date.getUTCMonth(),
              year: date.getUTCFullYear(),
            },
          },
          create: {
            userId: user.id,
            day: date.getUTCDate(),
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
            expense: type === "expense" ? amount : 0,
            income: type === "income" ? amount : 0,
          },
          update: {
            expense: { increment: type === "expense" ? amount : 0 },
            income: { increment: type === "income" ? amount : 0 },
          },
        });

        await tx.yearHistory.upsert({
          where: {
            month_year_userId: {
              userId: user.id,
              month: date.getUTCMonth(),
              year: date.getUTCFullYear(),
            },
          },
          create: {
            userId: user.id,
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
            expense: type === "expense" ? amount : 0,
            income: type === "income" ? amount : 0,
          },
          update: {
            expense: { increment: type === "expense" ? amount : 0 },
            income: { increment: type === "income" ? amount : 0 },
          },
        });
      },
      {
        maxWait: 10000, // Maximum time to wait for a transaction slot (10s)
        timeout: 10000, // Maximum time the transaction can run (10s)
      },
    );
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw new Error(
      `Failed to update transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
