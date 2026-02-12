"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import OpenAI from "openai";

export interface AiNudgeResult {
    message: string;
    type: "warning" | "info" | "success" | "neutral";
}

export async function GetAiNudge(): Promise<AiNudgeResult | null> {
    const user = await currentUser();
    if (!user) {
        return null;
    }

    // 1. Fetch relevant context data
    // We want current month's transactions and budget status
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [transactions, budgets, userSettings] = await Promise.all([
        prisma.transaction.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            select: {
                amount: true,
                description: true,
                category: true,
                type: true,
                date: true,
            },
            orderBy: {
                amount: 'desc',
            },
        }),
        prisma.budget.findMany({
            where: {
                userId: user.id,
            },
        }),
        prisma.userSettings.findUnique({
            where: { userId: user.id },
        }),
    ]);

    if (!userSettings) return null;

    const currency = userSettings.currency;

    // 2. Identify Potential "Nudges"
    
    // a) Budget Alerts (Spending > 80% of budget)
    let budgetAlerts: string[] = [];
    const expensesByCategory: Record<string, number> = {};
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    for (const budget of budgets) {
        const spent = expensesByCategory[budget.category] || 0;
        const percentage = (spent / budget.amount) * 100;
        
        // We only care if we are significantly through the budget (e.g. > 80%)
        // AND it's not the very end of the month (optional logic, but let's keep it simple)
        if (percentage > 80 && percentage < 100) {
            budgetAlerts.push(`User has spent ${percentage.toFixed(0)}% of their ${budget.category} budget.`);
        } else if (percentage >= 100) {
            budgetAlerts.push(`User has exceeded their ${budget.category} budget.`);
        }
    }

    // b) Large/Unusual Transactions
    // Let's definition "large" as > 10% of total income (if we knew income) or just a fixed threshold?
    // Better: Top 1 transaction if it's high value relative to others? 
    // Let's just pass the top 3 largest expenses to the AI and let it decide if it's notable.
    const largeExpenses = transactions
        .filter(t => t.type === 'expense')
        .slice(0, 3)
        .map(t => `${t.description} (${t.amount} ${currency})`);

    // c) Spending Velocity (Simple approximation)
    const totalSpent = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // 3. Construct Prompt
    // We give the AI the data and ask for a SINGLE "Nudge".
    const prompt = `
    You are a proactive financial assistant. Analyze the following user data for the current month and generate specific, helpful 1-sentence insight or "nudge".
    
    Context:
    - Today is day ${now.getDate()} of the month.
    - Total Spent so far: ${totalSpent} ${currency}
    - Budget Alerts: ${budgetAlerts.length > 0 ? budgetAlerts.join(", ") : "None"}
    - Top Recent Expenses: ${largeExpenses.join(", ")}
    
    Instructions:
    - If there are budget alerts, prioritize them. Warn the user nicely.
    - If there are big subscriptions or expenses, maybe flag them.
    - If everything looks good, give a positive reinforcement or a general saving tip based on their spending.
    - format: Plain text. Max 20 words. Friendly but professional tone.
    - Output ONLY the message.
    `;

    // 4. Call LLM
    const groqApiKey = process.env.GROQ_API_KEY;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    
    let message = "";
    let type: AiNudgeResult["type"] = "info";

    try {
        if (groqApiKey) {
            const groq = new Groq({ apiKey: groqApiKey });
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
            });
            message = completion.choices[0]?.message?.content || "";
        } else if (openRouterApiKey) {
            const client = new OpenAI({
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: openRouterApiKey,
            });
            const completion = await client.chat.completions.create({
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: [{ role: "user", content: prompt }],
            });
            message = completion.choices[0]?.message?.content || "";
        }
    } catch (error) {
        console.error("AI Nudge API Error", error);
        // Fallback if AI fails
        if (budgetAlerts.length > 0) {
            return { message: "Watch out! You're close to your budget limits.", type: "warning" };
        }
        return null;
    }

    if (!message) return null;

    // Simple heuristic to determine type (can be improved by asking LLM to return JSON)
    if (message.toLowerCase().includes("exceeded") || message.toLowerCase().includes("spent") || message.toLowerCase().includes("alert")) {
        type = "warning";
    } else if (message.toLowerCase().includes("great") || message.toLowerCase().includes("good")) {
        type = "success";
    }

    // Clean up quotes if present
    message = message.replace(/^"|"$/g, '');

    return {
        message,
        type
    };
}
