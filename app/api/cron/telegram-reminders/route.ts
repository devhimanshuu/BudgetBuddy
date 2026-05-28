import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Get tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // 2. Find all recurring transactions due tomorrow
    const upcomingBills = await prisma.recurringTransaction.findMany({
      where: {
        date: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        },
        deletedAt: null,
      },
    });

    if (upcomingBills.length === 0) {
      return NextResponse.json({ message: "No bills due tomorrow." });
    }

    // 3. For each bill, check if the user has a Telegram setting and send a reminder
    let reminderCount = 0;
    
    for (const bill of upcomingBills) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: bill.userId }
      });

      if (userSettings && userSettings.telegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
        const text = `⚠️ **Heads Up!**\nYour recurring expense for **${bill.description}** (${userSettings.currency} ${bill.amount}) is due tomorrow! Make sure you have enough balance.`;
        
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
    }

    return NextResponse.json({ message: `Sent ${reminderCount} reminders.` });
  } catch (error) {
    console.error("Cron Telegram Reminder Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
