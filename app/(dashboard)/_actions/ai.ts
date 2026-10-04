"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { CreateTransaction } from "./transaction";
import { UpdateTransaction } from "../transactions/_actions/updateTransaction";
import { DeleteTransaction } from "../transactions/_actions/deleteTransaction";
import { calculateLevel } from "@/lib/gamification";
import { getPersona } from "@/lib/persona";
import { getActiveWorkspace } from "@/lib/workspaces";
import {
	GROQ_MODEL,
	GROQ_FALLBACK_MODELS,
	OPENROUTER_FALLBACK_MODELS,
	REQUEST_TIMEOUT_MS,
} from "@/lib/llm-config";

export type ChatAIResponse = {
	text?: string;
	error?: string;
	persona?: any;
	healthScore?: number | null;
	level?: number;
	filter?: any;
	component?: string;
};

export async function ChatWithAI(
	message: string,
	history: { role: "user" | "model"; parts: { text: string }[] }[],
): Promise<ChatAIResponse> {
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
	let availableCategories: string[] = [];

	// Every provider/model endpoint we will try, in order, plus the reason
	// each one failed (surfaced to the user instead of being swallowed).
	const attempts: { label: string; run: () => Promise<any> }[] = [];
	const providerErrors: string[] = [];

	try {
		const workspace = await getActiveWorkspace(user.id);
		const [personaData, savingsGoals, userSettings, categories, achievements] =
			await Promise.all([
				getPersona(user.id, workspace?.id),
				prisma.savingsGoal.findMany({
					where: { userId: user.id },
					select: { name: true, targetAmount: true, currentAmount: true },
				}),
				prisma.userSettings.findFirst({ where: { userId: user.id } }),
				prisma.category.findMany({
					where: { userId: user.id },
					select: { name: true, type: true },
				}),
				prisma.userAchievement.findMany({
					where: { userId: user.id },
					include: { achievement: true },
				}),
			]);

		const levelInfo = calculateLevel(userSettings?.totalPoints || 0);

		const {
			persona,
			aiPrompt: personaPersonality,
			healthScore,
			level,
			unlockedList,
		} = personaData;

		// Fetch all transactions for insights (the AI still needs recent transactions for context)
		const twoMonthsAgo = new Date();
		twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
		const transactions = await prisma.transaction.findMany({
			where: {
				userId: user.id,
				date: { gte: twoMonthsAgo },
			},
			orderBy: { date: "desc" },
			take: 1000,
		});

		const budgets = await prisma.budget.findMany({
			where: { userId: user.id },
			select: { category: true, amount: true },
		});

		currency = userSettings?.currency || "USD";
		availableCategories = categories.map((c) => c.name);

		// --- INTELLIGENCE LOGIC (Anomalies & Forecasts) ---
		const dayOfMonth = new Date().getDate();
		const daysInMonth = new Date(
			new Date().getFullYear(),
			new Date().getMonth() + 1,
			0,
		).getDate();

		const categoryInsights = availableCategories
			.map((cat) => {
				const catExpenses = transactions.filter(
					(t) => t.category === cat && t.type === "expense",
				);
				const totalSpent = catExpenses.reduce((acc, t) => acc + t.amount, 0);
				const budget = budgets.find((b) => b.category === cat)?.amount || 0;

				// Simple Forecast
				const projected = (totalSpent / dayOfMonth) * daysInMonth;

				// Anomaly Detection (Simple: Check if any single transaction is > 3x the average for this category)
				const avgTx =
					catExpenses.length > 0 ? totalSpent / catExpenses.length : 0;
				const anomalies = catExpenses
					.filter((t) => t.amount > avgTx * 3)
					.map((t) => ({
						description: t.description,
						amount: t.amount,
						date: t.date.toISOString().split("T")[0],
					}));

				return {
					category: cat,
					spent: totalSpent,
					budget,
					projected,
					anomalies,
				};
			})
			.filter((insight) => insight.spent > 0 || insight.budget > 0);

		contextData = `
User Currency: ${currency}
User Financial Persona: ${persona}
Financial Health Score: ${healthScore}/100
User Level: ${levelInfo.currentLevel.level} - ${levelInfo.currentLevel.title} (${userSettings?.totalPoints || 0} pts)
User Streak: ${userSettings?.currentStreak || 0} days (Record: ${userSettings?.longestStreak || 0} days)
Available Categories: ${availableCategories.join(", ")}
Unlocked Achievements:
${achievements.map((a) => `- ${a.achievement.name}: ${a.achievement.description}`).join("\n")}
Insights (Forecasts & Anomalies):
${categoryInsights.map((i) => `- ${i.category}: Spent ${i.spent}, Budget ${i.budget}, Forecast ${i.projected.toFixed(0)}${i.anomalies.length > 0 ? `, ANOMALIES found: ${i.anomalies.map((a) => `${a.description} (${a.amount})`).join(", ")}` : ""}`).join("\n")}
Recent Transactions:
${transactions
	.slice(0, 50)
	.map(
		(t) =>
			`- ID[${t.id}] ${t.date.toISOString().split("T")[0]}: ${t.categoryIcon || ""} ${t.type} ${t.amount} (${t.category}) "${t.description}"`,
	)
	.join("\n")}
Budgets:
${budgets.map((b) => `- ${b.category}: ${b.amount}`).join("\n")}
Savings Goals:
${savingsGoals.map((s) => `- ${s.name}: ${s.currentAmount}/${s.targetAmount}`).join("\n")}
`;

		const systemInstruction = `You are Budget Buddy, an expert financial analyst with a unique personality adapted to the user.
${personaPersonality}

CURRENT USER TIER INFO:
- Level: ${levelInfo.currentLevel.level} 
- Tier: ${levelInfo.tier}

${levelInfo.currentLevel.level >= 10 ? "**STRATEGIC POWER-UP UNLOCKED**: You now have access to the 'simulate_future' tool whenever the user asks 'what if', 'is it worth it', or about future impact of a purchase/income change. It will render a beautiful predictive chart." : "Note: Strategic Simulator (simulate_future) is currently LOCKED for this user (Requires Lvl 10)."}

Use the provided data to answer user questions.
Format amounts in ${currency}.
**CRITICAL**: NEVER show internal IDs (e.g., ID[...]) to the user in your text response. These are for your internal tool use only.
Be concise and helpful.
Use Markdown.

### AI COMMAND CENTER CAPABILITIES:
1. **Transaction Creation**: Use 'create_transaction' to log new items.
2. **Visualizations (PRIORITY)**: If the user asks for a chart, bar chart, or summary, use the provided context Data to build a visual component. EMBED it at the END of your text response:
   - [BAR_CHART: { "title": "Spending by Category", "data": [{ "label": "Food", "value": 450 }, { "label": "Bills", "value": 1200 }] }]
   - [PIE_CHART: { "title": "Spending Distribution", "data": [{ "label": "Food", "value": 450 }, { "label": "Bills", "value": 1200 }] }]
   - [COMPARISON: { "current": 1200, "previous": 1500, "label": "Food Spending", "period": "vs Last Month" }]
   - [HEATMAP: { "title": "Spending Activity", "data": { "2024-01-15": 450, "2024-01-16": 120, "2024-01-17": 300 } }]
   - [PROGRESS_BAR: { "label": "Food Budget", "current": 450, "target": 500, "color": "amber" }]
   - [MINI_TREND: { "data": [10, 25, 15, 40, 30], "label": "Recent activity" }]
   - [LINE_CHART: { "title": "7-Day Spending Trend", "data": [120, 450, 300, 800, 200, 600, 400], "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }]

3. **Interactive Components**: Use these to allow the user to take action directly:
   - **Transaction Card**: Use when showing specific recent transactions. EMBED: [TRANSACTION_CARD: { "id": "uuid", "amount": 45, "description": "Coffee", "category": "Food", "categoryIcon": "☕", "type": "expense", "date": "2024-01-01" }]
   - **Budget Adjuster**: Use when suggesting budget changes. EMBED: [BUDGET_ADJUSTER: { "id": "uuid", "category": "Food", "current": 500, "suggested": 600 }]

4. **Smart Insights**: Use these to provide proactive value:
   - **Alert**: Detect unusual spending or critical issues. EMBED: [ALERT: { "type": "warning", "message": "You spent 3x more on dining this week", "amount": 450 }]
   - **Goal Progress**: Show savings progress with milestones. EMBED: [GOAL_PROGRESS: { "name": "Vacation Fund", "current": 750, "target": 1000, "milestones": [250, 500, 750] }]
   - **Forecast**: Predict end-of-month spending vs budget. EMBED: [FORECAST: { "category": "Food", "projected": 1200, "budget": 1000, "confidence": 0.85 }]
   - **Recap**: Provide daily/weekly summaries. EMBED: [RECAP: { "period": "Weekly", "stats": [{ "label": "Savings", "value": "+$200", "trend": "up" }], "tip": "Cut back on coffee to save $50 next week!" }]

5. **Gamification**: Use these to reward the user:
   - **Streak**: Show consecutive days of good habits. EMBED: [STREAK: { "days": 7, "type": "budget_adherence", "reward": "🔥" }]
   - **Achievement**: Award badges for milestones. EMBED: [ACHIEVEMENT: { "name": "Savings Master", "description": "Saved 20% of income for 3 months", "points": 100 }]

6. **Transaction Management**: 
   - Use 'edit_transaction' when requested to modify an existing item.
   - Use 'delete_transaction' when requested to remove an item.
   - User will typically provide an ID like ID[uuid].

7. **Filtering Table View**: Use 'search_transactions' ONLY when the user explicitly wants to update the main transaction table (e.g., "filter the table", "find travel over $100 in the list"). **Do NOT use this for visualization requests.**

**How to Chart**:
- Look at the 'Recent Transactions' in the context Data.
- Aggregate values by category or date.
- **LIMIT**: Only include the **Top 10** labels to keep the chart clean and avoid response truncation.
- Summarize the data in 1-2 sentences, then provide the appropriate tag.
- **Use PIE_CHART** for showing proportions/percentages (e.g., "spending breakdown")
- **Use COMPARISON** for month-over-month or period comparisons
- **Use HEATMAP** for showing activity patterns over time (requires date-value pairs)
- **Use ALERT** when looking at anomalies in the Insights section.
- **Use STREAK** when the user asks about their progress or logs a transaction that maintains a streak.
- **Use ACHIEVEMENT** when the user hits a new milestone or asks about rewards.

**Smart Suggestions (IMPORTANT)**: 
At the end of your response, strictly provide exactly 3 "Quick Action" buttons for follow-up questions in this format:
[SUGGESTIONS: ["How can I save more?", "Show my streak", "Give me a weekly recap"]]

Data:
${contextData}`;

		const tools: any[] = [
			{
				type: "function",
				function: {
					name: "create_transaction",
					description: "Create a new financial transaction (income or expense)",
					parameters: {
						type: "object",
						properties: {
							amount: { type: "number", description: "Amount" },
							description: { type: "string", description: "Description" },
							date: { type: "string", description: "Date (YYYY-MM-DD)" },
							category: {
								type: "string",
								description: "Category from available list",
							},
							type: {
								type: "string",
								enum: ["income", "expense"],
								description: "Type",
							},
						},
						required: ["amount", "date", "category", "type"],
					},
				},
			},
			{
				type: "function",
				function: {
					name: "edit_transaction",
					description:
						"Update an existing transaction. Use ID[uuid] provided in context.",
					parameters: {
						type: "object",
						properties: {
							id: {
								type: "string",
								description: "The UUID of the transaction to edit",
							},
							amount: { type: "number" },
							description: { type: "string" },
							date: { type: "string", description: "Date (YYYY-MM-DD)" },
							category: { type: "string" },
							type: { type: "string", enum: ["income", "expense"] },
						},
						required: ["id", "amount", "date", "category", "type"],
					},
				},
			},
			{
				type: "function",
				function: {
					name: "delete_transaction",
					description: "Delete a transaction by ID.",
					parameters: {
						type: "object",
						properties: {
							id: {
								type: "string",
								description: "The UUID of the transaction to delete",
							},
						},
						required: ["id"],
					},
				},
			},
		];

		if (levelInfo.currentLevel.level >= 10) {
			tools.push({
				type: "function",
				function: {
					name: "simulate_future",
					description:
						"Simulate the impact of a financial decision (e.g. buying a car, starting a subscription, saving more) over 12 months.",
					parameters: {
						type: "object",
						properties: {
							description: {
								type: "string",
								description:
									"What the user is planning to do (e.g. 'Buying a Tesla')",
							},
							initialCost: {
								type: "number",
								description: "Upfront cost if any",
							},
							monthlyImpact: {
								type: "number",
								description: "Monthly change in income (+) or expense (-)",
							},
							months: {
								type: "number",
								description: "Duration to simulate, default 12",
							},
						},
						required: ["description", "monthlyImpact"],
					},
				},
			});
		}

		// --- Shared response handling for every provider/model attempt ---
		const buildMessages = () => [
			{ role: "system", content: systemInstruction },
			...history
				.map((msg) => ({
					role: (msg.role === "model" ? "assistant" : "user") as any,
					content: msg.parts.map((p) => p.text || "").join(" "),
				}))
				// Providers reject empty user/assistant turns; dropping them keeps
				// a stray blank history entry from failing the whole request.
				.filter((msg) => (msg.content || "").trim().length > 0),
			{ role: "user", content: message },
		];

		// Executes any requested tool calls and builds the payload returned to
		// the chat window. Returns null when the model gave neither tools nor
		// text, so the caller can move on to the next model.
		const buildReply = async (
			responseMessage: any,
		): Promise<ChatAIResponse | null> => {
			let toolSummary = "";
			let filter: any = undefined;
			let component: any = undefined;

			if (responseMessage?.tool_calls?.length > 0) {
				for (const toolCall of responseMessage.tool_calls) {
					// A malformed tool payload or a failed DB write must not be
					// treated as a provider outage: it used to bubble up, retry
					// every model, and surface as "AI Service Unavailable."
					try {
						const tCall = toolCall as any;
						const args = JSON.parse(tCall.function?.arguments || "{}");
						const name = tCall.function?.name;

						if (name === "create_transaction") {
							await CreateTransaction({
								amount: args.amount,
								description: args.description || "AI Created",
								date: new Date(args.date),
								category: args.category,
								type: args.type,
							});
							toolSummary += `✅ Created ${args.type} of ${currency}${args.amount} for "${args.description}"\n`;
						} else if (name === "search_transactions") {
							filter = args;
							toolSummary += `🔍 Filtering transactions...\n`;
						} else if (name === "simulate_future") {
							const months = args.months || 12;
							const totalImpact =
								args.monthlyImpact * months - (args.initialCost || 0);
							toolSummary += `📈 Simulation: "${args.description}" total impact ${currency}${totalImpact.toFixed(2)}.\n`;
							component = `[SIMULATION_CARD: ${JSON.stringify({
								description: args.description,
								initialCost: args.initialCost || 0,
								monthlyImpact: args.monthlyImpact,
								totalImpact,
								months,
								currency,
							})}]`;
						} else if (name === "edit_transaction") {
							const cleanId = args.id.replace("ID[", "").replace("]", "");
							await UpdateTransaction(cleanId, {
								amount: args.amount,
								description: args.description,
								date: new Date(args.date),
								category: args.category,
								type: args.type,
							});
							toolSummary += `✏️ Updated transaction "${args.description}".\n`;
						} else if (name === "delete_transaction") {
							const cleanId = args.id.replace("ID[", "").replace("]", "");
							await DeleteTransaction(cleanId);
							toolSummary += `🗑️ Transaction deleted.\n`;
						}
					} catch (toolError: any) {
						console.error("Chat tool execution error", toolError);
						toolSummary += `⚠️ I couldn't complete that action: ${toolError?.message || toolError}\n`;
					}
				}
			}

			const text = toolSummary.trim() || responseMessage?.content || "";
			// An empty completion is a failed attempt, not a valid reply.
			if (!text.trim()) return null;

			return {
				text,
				persona,
				healthScore,
				level: levelInfo.currentLevel.level,
				filter,
				component,
			};
		};

		// --- Provider chain: every endpoint we will try, in order ---
		// Groq first, then the shared OpenRouter fallback chain. Model ids come
		// from lib/llm-config so every feature moves together when a provider
		// retires a model (this used to hardcode models Groq no longer serves,
		// which is what made the chatbot report "AI Service Unavailable.").
		if (groqApiKey) {
			const groq = new Groq({
				apiKey: groqApiKey,
				// Fail fast: Groq 429s carry a long Retry-After. The OpenRouter
				// chain below is the retry strategy.
				maxRetries: 0,
				timeout: REQUEST_TIMEOUT_MS,
			});
			for (const model of [GROQ_MODEL, ...GROQ_FALLBACK_MODELS]) {
				attempts.push({
					label: `groq/${model}`,
					run: () =>
						groq.chat.completions.create({
							messages: buildMessages(),
							model,
							tools,
							tool_choice: "auto",
						}),
				});
			}
		}

		if (openRouterApiKey) {
			const openai = new OpenAI({
				baseURL: "https://openrouter.ai/api/v1",
				apiKey: openRouterApiKey,
				maxRetries: 0,
				timeout: REQUEST_TIMEOUT_MS,
			});
			for (const model of OPENROUTER_FALLBACK_MODELS) {
				attempts.push({
					label: `openrouter/${model}`,
					run: () =>
						openai.chat.completions.create({
							model,
							messages: buildMessages(),
							tools,
						}),
				});
			}
		}

		for (const attempt of attempts) {
			try {
				const completion = await attempt.run();
				const reply = await buildReply(completion?.choices?.[0]?.message);
				if (reply) return reply;
				providerErrors.push(`${attempt.label}: empty response`);
			} catch (e: any) {
				const reason = `${e?.status ?? ""} ${
					e?.error?.message || e?.message || String(e)
				}`
					.replace(/\s+/g, " ")
					.trim();
				providerErrors.push(`${attempt.label}: ${reason.slice(0, 200)}`);
				console.error(`[ChatWithAI] ${attempt.label} failed:`, reason);
			}
		}

	} catch (error) {
		console.error("AI Flow Error", error);
		return { error: "Failed to process AI request." };
	}

	// Every configured model endpoint failed. Report why instead of hiding
	// the cause behind a bare "AI Service Unavailable.".
	console.error("[ChatWithAI] all model attempts failed:", providerErrors);
	return {
		error: providerErrors.length
			? `AI Service Unavailable. Tried ${providerErrors.length} endpoint(s): ${providerErrors
					.slice(0, 3)
					.join(" | ")}`
			: "AI Service Unavailable (no model endpoint configured).",
	};
}
