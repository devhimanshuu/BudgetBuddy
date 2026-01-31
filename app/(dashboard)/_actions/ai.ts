"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Groq from "groq-sdk";
import OpenAI from "openai";

export async function ChatWithAI(
	message: string,
	history: { role: "user" | "model"; parts: { text: string }[] }[],
) {
	const groqApiKey = process.env.GROQ_API_KEY;
	const openRouterApiKey = process.env.OPENROUTER_API_KEY;

	if (!groqApiKey && !openRouterApiKey) {
		return {
			error:
				"API Keys are missing. Please add GROQ_API_KEY or OPENROUTER_API_KEY to your .env file.",
		};
	}

	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	// 1. Fetch Context Data
	let contextData = "";
	let currency = "USD";
	try {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const [transactions, budgets, savingsGoals, userSettings] =
			await Promise.all([
				prisma.transaction.findMany({
					where: {
						userId: user.id,
						date: {
							gte: thirtyDaysAgo,
						},
					},
					orderBy: { date: "desc" },
					take: 500, // Safety limit, covers significant monthly activity
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

		currency = userSettings?.currency || "USD";

		contextData = `
User Currency: ${currency}
Recent Transactions:
${transactions.map((t) => `- ${t.date.toISOString().split("T")[0]}: ${t.type} ${t.amount} (${t.category}) "${t.description}"`).join("\n")}
Budgets:
${budgets.map((b) => `- ${b.category}: ${b.amount}`).join("\n")}
Savings Goals:
${savingsGoals.map((s) => `- ${s.name}: ${s.currentAmount}/${s.targetAmount}`).join("\n")}
`;
	} catch (error) {
		console.error("Error fetching context data:", error);
		return { error: "Failed to fetch financial data." };
	}

	const systemInstruction = `You are Budget Buddy, an expert financial analyst.
Use the provided data to answer user questions.
Format amounts in ${currency}.
Be concise and helpful.
Use Markdown.
Data:
${contextData}`;

	// Attempt 1: Groq
	if (groqApiKey) {
		try {
			console.log("Attempting Groq...");
			const groq = new Groq({ apiKey: groqApiKey });

			const messages: any[] = [
				{ role: "system", content: systemInstruction },
				...history.map((msg) => ({
					role: msg.role === "model" ? "assistant" : "user",
					content: msg.parts.map((p) => p.text || "").join(" "),
				})),
				{ role: "user", content: message },
			];

			const completion = await groq.chat.completions.create({
				messages: messages,
				model: "llama-3.3-70b-versatile",
			});

			const text = completion.choices[0]?.message?.content || "";
			console.log("Groq Success");
			return { text };
		} catch (error: any) {
			console.error("Groq Error:", error.message);
			// Fallthrough to OpenRouter
		}
	}

	// Attempt 2: OpenRouter Fallback
	if (openRouterApiKey) {
		try {
			console.log("Falling back to OpenRouter...");
			const client = new OpenAI({
				baseURL: "https://openrouter.ai/api/v1",
				apiKey: openRouterApiKey,
			});

			// Models to try in order
			const models = [
				"deepseek/deepseek-r1-0528:free",
				"meta-llama/llama-3.3-70b-instruct:free",
				"qwen/qwen3-coder:free",
			];

			const messages: any[] = [
				{ role: "system", content: systemInstruction },
				...history.map((msg) => ({
					role: msg.role === "model" ? "assistant" : "user",
					content: msg.parts.map((p) => p.text || "").join(" "),
				})),
				{ role: "user", content: message },
			];

			for (const model of models) {
				try {
					console.log(`OpenRouter: Attempting model: ${model}`);
					const completion = await client.chat.completions.create({
						model: model,
						messages: messages,
					});

					const text = completion.choices[0]?.message?.content || "";
					console.log(`OpenRouter: Success with ${model}`);
					return { text };
				} catch (innerError: any) {
					console.error(
						`OpenRouter Model ${model} failed:`,
						innerError.message,
					);
					// Continue loop
				}
			}
		} catch (error: any) {
			console.error("OpenRouter Setup Error:", error.message);
		}
	}

	return {
		error: "AI Service Unavailable. All providers and models failed.",
	};
}
