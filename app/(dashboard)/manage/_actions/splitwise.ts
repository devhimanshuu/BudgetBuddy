"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function UnlinkSplitwise() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: {
      splitwiseToken: null,
    },
  });

  revalidatePath("/manage");
  return { success: true };
}
