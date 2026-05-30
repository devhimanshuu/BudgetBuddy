"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function UpdateNotionSettings(notionApiKey: string, notionDatabaseId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: {
      notionApiKey,
      notionDatabaseId,
    },
  });

  revalidatePath("/manage");
  return { success: true };
}

export async function UnlinkNotion() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: {
      notionApiKey: null,
      notionDatabaseId: null,
    },
  });

  revalidatePath("/manage");
  return { success: true };
}
