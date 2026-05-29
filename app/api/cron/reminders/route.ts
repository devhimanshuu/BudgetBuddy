import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

async function sendDiscordDM(userId: string, content: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return;

  try {
    const channelRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bot ${token}` },
      body: JSON.stringify({ recipient_id: userId })
    });
    const channelData = await channelRes.json();
    if (channelData.id) {
      await fetch(`https://discord.com/api/v10/channels/${channelData.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bot ${token}` },
        body: JSON.stringify({ content })
      });
    }
  } catch (e) {
    console.error("Discord DM error:", e);
  }
}

export async function GET(req: Request) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const upcomingBills = await prisma.recurringTransaction.findMany({
      where: { date: { gte: startOfTomorrow, lte: endOfTomorrow }, deletedAt: null },
    });

    if (upcomingBills.length === 0) {
      return NextResponse.json({ message: "No bills due tomorrow." });
    }

    let reminderCount = 0;
    
    for (const bill of upcomingBills) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: bill.userId }
      });

      if (!userSettings) continue;

      const text = `⚠️ **Heads Up!**\nYour recurring expense for **${bill.description}** (${userSettings.currency} ${bill.amount}) is due tomorrow! Make sure you have enough balance.`;

      if (userSettings.telegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
        try {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: userSettings.telegramChatId, text, parse_mode: "Markdown" }),
          });
          reminderCount++;
        } catch (e) {
          console.error("Failed to send telegram reminder:", e);
        }
      }

      if (userSettings.discordUserId) {
        await sendDiscordDM(userSettings.discordUserId, text);
        reminderCount++;
      }
    }

    return NextResponse.json({ message: `Sent ${reminderCount} reminders across platforms.` });
  } catch (error) {
    console.error("Cron Reminder Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
