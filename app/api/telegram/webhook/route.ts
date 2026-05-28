import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Function to send a message back to Telegram
async function sendMessage(chatId: string | number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Telegram usually sends updates in `message` or `edited_message`
    const message = body.message || body.edited_message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id.toString();
    const text = message.text;

    // 1. Check if user is linked
    const userSettings = await prisma.userSettings.findUnique({
      where: { telegramChatId: chatId }
    });

    if (!userSettings) {
      // User is not linked
      await sendMessage(
        chatId,
        `Welcome to BudgetBuddy! 🚀\n\nYour Telegram Chat ID is: \`${chatId}\`\n\nPlease go to the **Manage** page in your BudgetBuddy app, and paste this ID into the Telegram Integration settings to link your account.`
      );
      return NextResponse.json({ ok: true });
    }

    // 2. Parse text with AI
    // We expect the user to send something like: "50 on food" or "salary 5000"
    const prompt = `
      You are an AI assistant parsing expense/income logs for a budgeting app.
      Extract the following information from the user's message:
      - amount (number)
      - category (string, capitalize the first letter, try to match common categories like Food, Transport, Housing, Utilities, Entertainment, Salary)
      - description (short string)
      - type ("expense" or "income")
      
      User's message: "${text}"
      
      Output ONLY a valid JSON object with those exact keys. Example: {"amount": 50, "category": "Food", "description": "lunch", "type": "expense"}
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const aiResultStr = response.choices[0].message.content;
    if (!aiResultStr) throw new Error("AI returned no output");
    
    // Extract JSON from the response (may contain markdown code fences)
    const jsonMatch = aiResultStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Validate parsed data
    if (!parsedData.amount || !parsedData.category || !parsedData.type) {
      await sendMessage(chatId, "❌ I couldn't understand that. Please try sending a message like `50 for food`.");
      return NextResponse.json({ ok: true });
    }

    // 3. Find user's active workspace (or first workspace)
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: userSettings.userId, deletedAt: null }
    });

    if (!membership) {
      await sendMessage(chatId, "❌ You don't have any active workspaces.");
      return NextResponse.json({ ok: true });
    }

    // 4. Determine category icon (a simple mapping or default)
    let categoryIcon = "🏷️";
    if (parsedData.category.toLowerCase().includes("food")) categoryIcon = "🍔";
    if (parsedData.category.toLowerCase().includes("transport")) categoryIcon = "🚗";
    if (parsedData.category.toLowerCase().includes("salary")) categoryIcon = "💰";

    // 5. Create Transaction
    await prisma.transaction.create({
      data: {
        userId: userSettings.userId,
        workspaceId: membership.workspaceId,
        amount: parsedData.amount,
        description: parsedData.description || parsedData.category,
        date: new Date(),
        type: parsedData.type,
        category: parsedData.category,
        categoryIcon,
      }
    });

    // 6. Confirm success
    const typeEmoji = parsedData.type === "income" ? "📈" : "📉";
    await sendMessage(
      chatId,
      `✅ Added ${userSettings.currency} ${parsedData.amount} to **${parsedData.category}** ${typeEmoji}`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
