import prisma from "@/lib/prisma";
import Groq from "groq-sdk";
import { getPersona } from "@/lib/persona";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function ChatWithAIHeadless(
  userId: string,
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return "❌ Groq API Key is missing. I cannot process this request right now.";
  }

  // 1. Fetch Context Data
  let contextData = "";
  let currency = "USD";
  let availableCategories: string[] = [];

  try {
    const workspace = await getActiveWorkspace(userId);
    const [personaData, savingsGoals, userSettings, categories] = await Promise.all([
      getPersona(userId, workspace?.id),
      prisma.savingsGoal.findMany({
        where: { userId: userId },
        select: { name: true, targetAmount: true, currentAmount: true },
      }),
      prisma.userSettings.findUnique({ where: { userId } }),
      prisma.category.findMany({
        where: { userId: userId },
        select: { name: true, type: true },
      }),
    ]);

    const { persona, aiPrompt: personaPersonality } = personaData;

    // Fetch all transactions for insights
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: twoMonthsAgo } },
      orderBy: { date: "desc" },
      take: 200,
    });

    const budgets = await prisma.budget.findMany({
      where: { userId: userId },
      select: { category: true, amount: true },
    });

    currency = userSettings?.currency || "USD";
    availableCategories = categories.map((c) => c.name);

    contextData = `
User Currency: ${currency}
User Financial Persona: ${persona}
Available Categories: ${availableCategories.join(", ")}
Recent Transactions:
${transactions
  .slice(0, 30)
  .map((t) => `- ${t.date.toISOString().split("T")[0]}: ${t.type} ${t.amount} (${t.category}) "${t.description}"`)
  .join("\n")}
Budgets:
${budgets.map((b) => `- ${b.category}: ${b.amount}`).join("\n")}
Savings Goals:
${savingsGoals.map((s) => `- ${s.name}: ${s.currentAmount}/${s.targetAmount}`).join("\n")}
`;

    const systemInstruction = `You are Budget Buddy, an expert financial analyst with a unique personality adapted to the user.
${personaPersonality}

Use the provided data to answer user questions.
Format amounts in ${currency}.
Be concise and helpful, since you are chatting on Telegram. Use Telegram-friendly Markdown.
DO NOT use custom React tags like [BAR_CHART: ...]. If the user asks for a chart or summary, provide a beautiful text-based summary using bullet points or emojis.

Data:
${contextData}`;

    const groq = new Groq({ apiKey: groqApiKey });
    const messages: any[] = [
      { role: "system", content: systemInstruction },
      ...history,
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    return completion.choices[0].message.content || "I couldn't generate a response.";
  } catch (error) {
    console.error("Telegram AI Flow Error", error);
    return "❌ Sorry, I encountered an error while trying to think of a response.";
  }
}
