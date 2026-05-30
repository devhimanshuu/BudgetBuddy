"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function LinkSlack(slackId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify the slack ID isn't already used by someone else
  const existing = await prisma.userSettings.findUnique({
    where: { slackUserId: slackId }
  });

  if (existing && existing.userId !== user.id) {
    throw new Error("This Slack User ID is already linked to another account.");
  }

  // Update user settings
  await prisma.userSettings.update({
    where: { userId: user.id },
    data: { slackUserId: slackId }
  });

  revalidatePath("/manage");
  
  return { success: true };
}

export async function UnlinkSlack() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: { slackUserId: null }
  });

  revalidatePath("/manage");
  
  return { success: true };
}
