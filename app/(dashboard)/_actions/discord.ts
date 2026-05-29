"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function LinkDiscordUser(discordId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Check if discord ID is already in use by another user
  const existing = await prisma.userSettings.findUnique({
    where: { discordUserId: discordId }
  });

  if (existing && existing.userId !== user.id) {
    throw new Error("This Discord account is already linked to another BudgetBuddy account.");
  }

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: { discordUserId: discordId }
  });

  return { success: true };
}

export async function UnlinkDiscordUser() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: { discordUserId: null }
  });

  return { success: true };
}
