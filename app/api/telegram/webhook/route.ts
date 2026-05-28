import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Groq from "groq-sdk";
import { ChatWithAIHeadless } from "@/lib/telegram-ai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Helper: Send Telegram Message
async function sendMessage(chatId: string | number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

// Helper: Ensure Category Exists
async function ensureCategory(workspaceId: string, userId: string, categoryName: string, type: string) {
  let category = await prisma.category.findFirst({
    where: { workspaceId, name: categoryName }
  });
  if (!category) {
    // Dynamic category creation!
    let icon = "🏷️";
    const nameLower = categoryName.toLowerCase();
    if (nameLower.includes("food") || nameLower.includes("dining")) icon = "🍔";
    else if (nameLower.includes("transport")) icon = "🚗";
    else if (nameLower.includes("salary")) icon = "💰";
    else if (nameLower.includes("grocery")) icon = "🛒";
    else if (nameLower.includes("health")) icon = "💊";

    category = await prisma.category.create({
      data: {
        name: categoryName,
        userId,
        workspaceId,
        icon,
        type,
        color: "#3b82f6"
      }
    });
  }
  return category;
}

// Helper: Ensure Tags Exist and return their IDs
async function ensureTags(workspaceId: string, userId: string, tagNames: string[]) {
  const tagIds = [];
  for (const name of tagNames) {
    const cleanName = name.trim().replace(/^#/, '');
    if (!cleanName) continue;
    
    let tag = await prisma.tag.findFirst({
      where: { workspaceId, name: cleanName, userId }
    });
    
    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: cleanName, userId, workspaceId, color: "#8b5cf6" }
      });
    }
    tagIds.push(tag.id);
  }
  return tagIds;
}

// Helper: Save the Transaction manually (replicating CreateTransaction logic)
async function saveDraftTransaction(userId: string, workspaceId: string, draft: any) {
  const date = new Date();
  
  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId,
        workspaceId,
        amount: draft.amount,
        description: draft.description || draft.category,
        notes: draft.notes || null,
        date,
        type: draft.type,
        category: draft.category,
        categoryIcon: draft.categoryIcon || "🏷️",
        status: "APPROVED"
      }
    });

    if (draft.tagIds && draft.tagIds.length > 0) {
      await tx.transactionTag.createMany({
        data: draft.tagIds.map((tagId: string) => ({
          transactionId: transaction.id,
          tagId
        }))
      });
    }

    if (draft.splits && draft.splits.length > 0) {
      await tx.transactionSplit.createMany({
        data: draft.splits.map((s: any) => ({
          transactionId: transaction.id,
          category: s.category,
          categoryIcon: s.categoryIcon || "🏷️",
          amount: s.amount,
          percentage: (s.amount / draft.amount) * 100
        }))
      });
    }

    // Update Aggregates
    await tx.monthlyHistory.upsert({
      where: { day_month_year_userId: { userId, day: date.getUTCDate(), month: date.getUTCMonth(), year: date.getUTCFullYear() } },
      create: { userId, workspaceId, day: date.getUTCDate(), month: date.getUTCMonth(), year: date.getUTCFullYear(), expense: draft.type === "expense" ? draft.amount : 0, income: draft.type === "income" ? draft.amount : 0, investment: draft.type === "investment" ? draft.amount : 0 },
      update: { expense: { increment: draft.type === "expense" ? draft.amount : 0 }, income: { increment: draft.type === "income" ? draft.amount : 0 }, investment: { increment: draft.type === "investment" ? draft.amount : 0 } }
    });

    await tx.yearHistory.upsert({
      where: { month_year_userId: { userId, month: date.getUTCMonth(), year: date.getUTCFullYear() } },
      create: { userId, workspaceId, month: date.getUTCMonth(), year: date.getUTCFullYear(), expense: draft.type === "expense" ? draft.amount : 0, income: draft.type === "income" ? draft.amount : 0, investment: draft.type === "investment" ? draft.amount : 0 },
      update: { expense: { increment: draft.type === "expense" ? draft.amount : 0 }, income: { increment: draft.type === "income" ? draft.amount : 0 }, investment: { increment: draft.type === "investment" ? draft.amount : 0 } }
    });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message || body.edited_message;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id.toString();
    const text = message.text.trim();

    // 1. Verify User
    const userSettings = await prisma.userSettings.findUnique({
      where: { telegramChatId: chatId }
    });

    if (!userSettings) {
      await sendMessage(chatId, `Welcome! Your Telegram Chat ID is: \`${chatId}\`\nPlease enter this in BudgetBuddy Settings to link your account.`);
      return NextResponse.json({ ok: true });
    }

    // Get Workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: userSettings.userId, deletedAt: null }
    });
    if (!membership) {
      await sendMessage(chatId, "❌ You don't have any active workspaces.");
      return NextResponse.json({ ok: true });
    }
    const workspaceId = membership.workspaceId;

    // 2. Get or Create Session
    let session = await prisma.telegramSession.findUnique({ where: { chatId } });
    if (!session) {
      session = await prisma.telegramSession.create({
        data: { chatId, userId: userSettings.userId, state: "IDLE", context: {} }
      });
    }

    // 3. Handle Global Commands
    if (text.toLowerCase() === "/cancel" || text.toLowerCase() === "/exit") {
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "IDLE", context: {} }
      });
      await sendMessage(chatId, "✅ Action cancelled. I am back to normal mode. Send me an expense, or type `/chatbot` to chat.");
      return NextResponse.json({ ok: true });
    }

    if (text.toLowerCase() === "/chatbot") {
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "CHATBOT", context: { history: [] } }
      });
      await sendMessage(chatId, "🤖 **BudgetBuddy AI Chatbot Activated!**\nAsk me anything about your finances. (Type `/exit` to leave)");
      return NextResponse.json({ ok: true });
    }

    // 4. State Machine
    const state = session.state;
    const context: any = session.context || {};

    if (state === "CHATBOT") {
      const history = context.history || [];
      const responseText = await ChatWithAIHeadless(userSettings.userId, text, history);
      
      // Update history
      history.push({ role: "user", content: text });
      history.push({ role: "assistant", content: responseText });
      // Keep last 10 messages
      const prunedHistory = history.slice(-10);
      
      await prisma.telegramSession.update({
        where: { chatId }, data: { context: { ...context, history: prunedHistory } }
      });
      
      await sendMessage(chatId, responseText);
      return NextResponse.json({ ok: true });
    }

    if (state === "IDLE") {
      // Parse initial transaction
      const prompt = `
        You are an AI assistant parsing expense/income logs for a budgeting app.
        Extract: amount (number), category (string, capitalized), description (short string), type ("expense" or "income").
        User's message: "${text}"
        Output ONLY a valid JSON object. Example: {"amount": 50, "category": "Food", "description": "lunch", "type": "expense"}
      `;
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      const jsonMatch = (response.choices[0].message.content || "").match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        await sendMessage(chatId, "❌ I couldn't understand that. Try `50 for food`.");
        return NextResponse.json({ ok: true });
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      if (!parsedData.amount || !parsedData.category || !parsedData.type) {
        await sendMessage(chatId, "❌ Missing required fields. Try `50 for food`.");
        return NextResponse.json({ ok: true });
      }

      // Ensure dynamic category
      const category = await ensureCategory(workspaceId, userSettings.userId, parsedData.category, parsedData.type);
      parsedData.categoryIcon = category.icon;

      // Save draft and move to AWAITING_NOTES
      await prisma.telegramSession.update({
        where: { chatId },
        data: { state: "AWAITING_NOTES", context: parsedData }
      });

      await sendMessage(chatId, `✅ Drafted: **${userSettings.currency} ${parsedData.amount}** for **${parsedData.category}**.\n\n📝 Would you like to add any **Notes**? (Reply with your note, or type \`skip\`)`);
      return NextResponse.json({ ok: true });
    }

    if (state === "AWAITING_NOTES") {
      if (text.toLowerCase() !== "skip") context.notes = text;
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "AWAITING_TAGS", context }
      });
      await sendMessage(chatId, `🏷️ Would you like to add **Tags**? (Reply with tags separated by commas, e.g. "vacation, family", or type \`skip\`)`);
      return NextResponse.json({ ok: true });
    }

    if (state === "AWAITING_TAGS") {
      if (text.toLowerCase() !== "skip") {
        const tagNames = text.split(",").map(t => t.trim()).filter(Boolean);
        context.tagIds = await ensureTags(workspaceId, userSettings.userId, tagNames);
      }
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "AWAITING_SPLITS", context }
      });
      await sendMessage(chatId, `✂️ Would you like to **Split** this across other categories? (Reply with amounts and categories, e.g. "10 to Drinks", or type \`skip\`)`);
      return NextResponse.json({ ok: true });
    }

    if (state === "AWAITING_SPLITS") {
      if (text.toLowerCase() !== "skip") {
        // AI parse splits
        const prompt = `
          The user is splitting a total expense of ${context.amount} across other categories.
          Extract the splits. User message: "${text}"
          Output ONLY a valid JSON array of objects. Example: [{"amount": 10, "category": "Drinks"}]
        `;
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        });
        const jsonMatch = (response.choices[0].message.content || "").match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const splits = JSON.parse(jsonMatch[0]);
          for (const s of splits) {
            const cat = await ensureCategory(workspaceId, userSettings.userId, s.category, context.type);
            s.categoryIcon = cat.icon;
          }
          context.splits = splits;
        }
      }

      // Save Transaction
      await saveDraftTransaction(userSettings.userId, workspaceId, context);
      
      // Reset State
      await prisma.telegramSession.update({
        where: { chatId }, data: { state: "IDLE", context: {} }
      });

      const typeEmoji = context.type === "income" ? "📈" : "📉";
      await sendMessage(chatId, `🎉 **Done!** Transaction fully saved. ${typeEmoji}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
