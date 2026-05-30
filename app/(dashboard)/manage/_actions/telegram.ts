"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function LinkTelegramChat(chatId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify the chat ID isn't already used by someone else
  const existing = await prisma.userSettings.findUnique({
    where: { telegramChatId: chatId }
  });

  if (existing && existing.userId !== user.id) {
    throw new Error("This Telegram Chat ID is already linked to another account.");
  }

  // Update user settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: { telegramChatId: chatId },
    create: {
      userId: user.id,
      currency: "USD",
      telegramChatId: chatId
    }
  });

  revalidatePath("/manage");

  return { success: true };
}

export async function UnlinkTelegramChat() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: { telegramChatId: null }
  });

  revalidatePath("/manage");

  return { success: true };
}
