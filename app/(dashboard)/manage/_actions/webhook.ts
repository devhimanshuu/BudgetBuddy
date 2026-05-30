"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";

export async function GenerateWebhookToken() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const token = randomUUID();

  // Create or update UserSettings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      currency: "USD",
      webhookToken: token,
    },
    update: {
      webhookToken: token,
    },
  });

  return token;
}

export async function GetWebhookToken() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
    select: { webhookToken: true },
  });

  return settings?.webhookToken || null;
}

export async function GetWebhookLogs() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const logs = await prisma.webhookLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return logs;
}
