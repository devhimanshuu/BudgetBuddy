import prisma from "@/lib/prisma";

export async function getActiveSubscriptions(userId: string, workspaceId: string | undefined) {
  return prisma.recurringTransaction.findMany({
    where: {
      ...(workspaceId ? { workspaceId } : { userId }),
      type: "expense",
      deletedAt: null,
    },
    orderBy: { amount: "desc" },
  });
}
