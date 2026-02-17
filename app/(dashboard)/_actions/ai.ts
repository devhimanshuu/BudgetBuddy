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
	let availableCategories: string[] = [];

	try {
		let persona = "Fox";
		let personaPersonality = "";

		const twoMonthsAgo = new Date();
		twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

		const [
			transactions,
			budgets,
			savingsGoals,
			userSettings,
			categories,
			achievements,
		] = await Promise.all([
			prisma.transaction.findMany({
				where: {
					userId: user.id,
					date: {
						gte: twoMonthsAgo,
					},
				},
				orderBy: { date: "desc" },
				take: 1000,
				select: {
					id: true,
					amount: true,
					description: true,
					category: true,
					categoryIcon: true,
					date: true,
					type: true,
				},
			}),
			prisma.budget.findMany({
				where: { userId: user.id },
				select: { id: true, category: true, amount: true },
			}),
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

		currency = userSettings?.currency || "USD";
		availableCategories = categories.map((c) => c.name);

		// --- PERSONA LOGIC ---
		const last30Days = new Date();
		last30Days.setDate(last30Days.getDate() - 30);

		const recentTx = transactions.filter((t) => t.date >= last30Days);
		const totalIncome = recentTx
			.filter((t) => t.type === "income")
			.reduce((acc, t) => acc + t.amount, 0);
		const totalExpense = recentTx
			.filter((t) => t.type === "expense")
			.reduce((acc, t) => acc + t.amount, 0);

		const luxuryCategories = [
			"Shopping",
			"Entertainment",
			"Travel",
			"Dining",
			"Luxury",
			"Misc",
		];
		const luxurySpending = recentTx
			.filter(
				(t) => t.type === "expense" && luxuryCategories.includes(t.category),
			)
			.reduce((acc, t) => acc + t.amount, 0);

		const savingsRate =
			totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
		const luxuryRate = totalExpense > 0 ? luxurySpending / totalExpense : 0;

		// Check Budget Adherence
		let overBudgetCount = 0;
		budgets.forEach((b) => {
			const spentInCategory = recentTx
				.filter((t) => t.type === "expense" && t.category === b.category)
				.reduce((acc, t) => acc + t.amount, 0);
			if (spentInCategory > b.amount) overBudgetCount++;
		});
		const budgetAdherence =
			budgets.length > 0 ? 1 - overBudgetCount / budgets.length : 1;

		const levelInfo = calculateLevel(userSettings?.totalPoints || 0);
		const tier = levelInfo.tier;
		const unlockedList = levelInfo.unlockedFeatures
			.map((f) => f.name)
			.join(", ");

		const healthScore = Math.min(
			Math.max(
				Math.floor(savingsRate * 150 + budgetAdherence * 50 - luxuryRate * 100),
				0,
			),
			100,
		);

		if (savingsRate > 0.3) {
			persona = "Squirrel";
			personaPersonality = `USER PERSONA: ${tier} Squirrel (Wealth Builder). Be encouraging, praise their discipline, and suggest how to optimize their growing savings. Personality: Wise, protective, and slightly obsessive about nuts (savings). Unlocked: ${unlockedList}`;
		} else if (luxuryRate > 0.4) {
			persona = "Peacock";
			personaPersonality = `USER PERSONA: ${tier} Peacock (Luxury Spender). Be a bit 'savage' and playfully roast their high-end spending. Urge them to find value and cut unnecessary waste. Personality: Glamorous, bold, but brutally honest about overpriced vanity. Unlocked: ${unlockedList}`;
		} else if (budgetAdherence > 0.9 && budgets.length > 0) {
			persona = "Owl";
			personaPersonality = `USER PERSONA: ${tier} Owl (The Strategist). They are perfect at budgeting. Be professional, data-driven, and provide high-level insights. Personality: Intelligent, calm, and focused on long-term foresight. Unlocked: ${unlockedList}`;
		} else {
			persona = "Fox";
			personaPersonality = `USER PERSONA: ${tier} Fox (Balanced). Be quick, clever, and help them maintain their steady financial balance. Personality: Agile, street-smart, and always looking for the best deal/opportunity. Unlocked: ${unlockedList}`;
		}

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
${budgets.map((b) => `- ID[${b.id}] ${b.category}: ${b.amount}`).join("\n")}
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

		// Attempt 1: Groq
		if (groqApiKey) {
			try {
				const groq = new Groq({ apiKey: groqApiKey });
				const messages: any[] = [
					{ role: "system", content: systemInstruction },
					...history.map((msg) => ({
						role: (msg.role === "model" ? "assistant" : "user") as any,
						content: msg.parts.map((p) => p.text || "").join(" "),
					})),
					{ role: "user", content: message },
				];

				const groqModels = ["llama-3.3-70b-versatile", "llama3-70b-8192"];

				for (const model of groqModels) {
					try {
						const completion = await groq.chat.completions.create({
							messages,
							model,
							tools,
							tool_choice: "auto",
						});

						const responseMessage = completion.choices[0].message;

						if (
							responseMessage.tool_calls &&
							responseMessage.tool_calls.length > 0
						) {
							let toolSummary = "";
							let filter = undefined;
							let component = undefined;

							for (const toolCall of responseMessage.tool_calls) {
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
							}

							return {
								text: toolSummary.trim() || responseMessage.content || "",
								persona,
								healthScore,
								filter,
								component,
							};
						}
						return {
							text: responseMessage.content || "",
							persona,
							healthScore,
						};
					} catch (e) {
						continue;
					}
				}
			} catch (e) {
				console.error("Groq Error", e);
			}
		}

		// Attempt 2: OpenRouter
		if (openRouterApiKey) {
			try {
				const openai = new OpenAI({
					baseURL: "https://openrouter.ai/api/v1",
					apiKey: openRouterApiKey,
				});
				const response = await openai.chat.completions.create({
					model: "google/gemini-2.0-flash-exp:free",
					messages: [
						{ role: "system", content: systemInstruction },
						...history.map((msg) => ({
							role: (msg.role === "model" ? "assistant" : "user") as any,
							content: msg.parts.map((p) => p.text || "").join(" "),
						})),
						{ role: "user", content: message },
					],
					tools,
				});

				const responseMessage = response.choices[0].message;
				if (
					responseMessage.tool_calls &&
					responseMessage.tool_calls.length > 0
				) {
					let toolSummary = "";
					let filter = undefined;
					let component = undefined;

					for (const toolCall of responseMessage.tool_calls) {
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
					}

					return {
						text: toolSummary.trim() || responseMessage.content || "",
						persona,
						healthScore,
						filter,
						component,
					};
				}
				return { text: responseMessage.content || "", persona, healthScore };
			} catch (e) {
				console.error("OpenRouter Error", e);
			}
		}
	} catch (error) {
		console.error("AI Flow Error", error);
		return { error: "Failed to process AI request." };
	}

	return { error: "AI Service Unavailable." };
}
