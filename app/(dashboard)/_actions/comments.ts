"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/workspaces";

export async function AddComment(params: {
  content: string;
  transactionId?: string;
  budgetData?: {
    userId: string;
    category: string;
    month: number;
    year: number;
  };
  proposalId?: string;
  parentId?: string;
  workspaceId: string;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const userName = user.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user.emailAddresses[0].emailAddress.split("@")[0];

  const comment = await prisma.comment.create({
    data: {
      content: params.content,
      userId: user.id,
      userName: userName,
      userImage: user.imageUrl,
      transactionId: params.transactionId,
      budgetUserId: params.budgetData?.userId,
      budgetCategory: params.budgetData?.category,
      budgetMonth: params.budgetData?.month,
      budgetYear: params.budgetData?.year,
      proposalId: params.proposalId,
      parentId: params.parentId,
    },
  });

  // Log activity
  let type = "COMMENT_ADDED";
  let description = `${userName} added a comment`;
  
  if (params.parentId) {
    type = "COMMENT_REPLIED";
    description = `${userName} replied to a comment`;
  }

  await logActivity({
    workspaceId: params.workspaceId,
    userId: user.id,
    type,
    description,
    metadata: {
      commentId: comment.id,
      transactionId: params.transactionId,
      budgetCategory: params.budgetData?.category,
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/manage");

  return comment;
}

export async function GetComments(params: {
  transactionId?: string;
  budgetData?: {
    userId: string;
    category: string;
    month: number;
    year: number;
  };
  proposalId?: string;
}) {
  const comments = await prisma.comment.findMany({
    where: {
      transactionId: params.transactionId,
      budgetUserId: params.budgetData?.userId,
      budgetCategory: params.budgetData?.category,
      budgetMonth: params.budgetData?.month,
      budgetYear: params.budgetData?.year,
      proposalId: params.proposalId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      replies: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  // Return only top-level comments (they contain the replies)
  return comments.filter((c) => !c.parentId);
}

export async function DeleteComment(commentId: string, workspaceId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== user.id) throw new Error("You can only delete your own comments");

  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });

  await logActivity({
    workspaceId,
    userId: user.id,
    type: "COMMENT_DELETED",
    description: "Deleted a comment",
  });

  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/manage");

  return { success: true };
}
