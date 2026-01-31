"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { GoogleGenAI } from "@google/genai";

export async function ChatWithAI(
	message: string,
	history: { role: "user" | "model"; parts: { text: string }[] }[],
) {
	const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
	if (!apiKey) {
		return {
			error:
				"Gemini API Key is missing. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env file.",
		};
	}

	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	try {
		// 1. Fetch Context Data
		const [transactions, budgets, savingsGoals, userSettings] =
			await Promise.all([
				prisma.transaction.findMany({
					where: { userId: user.id },
					orderBy: { date: "desc" },
					take: 50,
					select: {
						amount: true,
						description: true,
						category: true,
						date: true,
						type: true,
					},
				}),
				prisma.budget.findMany({
					where: { userId: user.id },
					select: { category: true, amount: true },
				}),
				prisma.savingsGoal.findMany({
					where: { userId: user.id },
					select: { name: true, targetAmount: true, currentAmount: true },
				}),
				prisma.userSettings.findFirst({ where: { userId: user.id } }),
			]);

		const currency = userSettings?.currency || "USD";

		// 2. Prepare System Prompt
		const contextData = `
User Currency: ${currency}
Recent Transactions:
${transactions.map((t) => `- ${t.date.toISOString().split("T")[0]}: ${t.type} ${t.amount} (${t.category}) "${t.description}"`).join("\n")}
Budgets:
${budgets.map((b) => `- ${b.category}: ${b.amount}`).join("\n")}
Savings Goals:
${savingsGoals.map((s) => `- ${s.name}: ${s.currentAmount}/${s.targetAmount}`).join("\n")}
`;

		const systemInstruction = `You are Budget Buddy, an expert financial analyst.
Use the provided data to answer user questions.
Format amounts in ${currency}.
Be concise and helpful.
Use Markdown.
Data:
${contextData}`;

		// 3. Initialize New SDK
		const genAI = new GoogleGenAI({ apiKey });

		// 4. Transform history for Gemini SDK
		// Gemini expects: { role: 'user' | 'model', parts: [{ text: string }] }
		// This matches our internal type, so we just map it cleanly.
		const contents = history.map((msg) => ({
			role: msg.role,
			parts: msg.parts.map((p) => ({ text: p.text })),
		}));

		// Add the new user message
		contents.push({
			role: "user",
			parts: [{ text: message }],
		});

		// 5. Call API
		// Trying gemini-1.5-flash as a standard free tier model.
		const result = await genAI.models.generateContent({
			model: "gemini-2.0-flash-lite",
			config: {
				systemInstruction: {
					parts: [{ text: systemInstruction }],
				},
			},
			contents: contents,
		});

		// 6. Parse Response
		// Accessing text as a property based on previous findings with this SDK version
		const text = result.text || "";

		return { text };
	} catch (error: any) {
		console.error("GenAI Error:", error);
		return {
			error: `AI Error: ${error.message || "Unknown error"}.`,
		};
	}
}
