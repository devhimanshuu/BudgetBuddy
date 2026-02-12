"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { CreateTransaction } from "./transaction";

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
		const twoMonthsAgo = new Date();
		twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

		const [transactions, budgets, savingsGoals, userSettings, categories] =
			await Promise.all([
				prisma.transaction.findMany({
					where: {
						userId: user.id,
						date: {
							gte: twoMonthsAgo,
						},
					},
					orderBy: { date: "desc" },
					take: 1000, // Safety limit for 2 months of activity
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
				prisma.category.findMany({
					where: { userId: user.id },
					select: { name: true, type: true },
				}),
			]);

		currency = userSettings?.currency || "USD";
		availableCategories = categories.map((c) => c.name);

		contextData = `
User Currency: ${currency}
Available Categories: ${availableCategories.join(", ")}
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

### AI COMMAND CENTER CAPABILITIES:
1. **Transaction Creation**: Use 'create_transaction' to log new items.
2. **Advanced Filtering**: Use 'search_transactions' when the user wants to "show", "find", or "filter" their history. 
   - Example: "Show me travel over $100" -> search_transactions(minAmount: 100, category: "Travel")
3. **Living UI Components**: When discussing budgets or trends, you can EMBED visual components by using this syntax at the END of your message:
   - [PROGRESS_BAR: { "label": "Food Budget", "current": 450, "target": 500, "color": "amber" }]
   - [MINI_TREND: { "data": [10, 20, 15, 30, 25], "label": "Last 5 days spending" }]

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
						amount: {
							type: "number",
							description: "Amount of the transaction",
						},
						description: {
							type: "string",
							description: "Description or title of the transaction",
						},
						date: {
							type: "string",
							description: "Date of the transaction in ISO format (YYYY-MM-DD)",
						},
						category: {
							type: "string",
							description:
								"Category of the transaction. Must be strictly one of: " +
								availableCategories.join(", "),
						},
						type: {
							type: "string",
							enum: ["income", "expense"],
							description: "Type of transaction",
						},
					},
					required: ["amount", "date", "category", "type"],
				},
			},
		},
		{
			type: "function",
			function: {
				name: "search_transactions",
				description:
					"Filter and find specific transactions in the user's history",
				parameters: {
					type: "object",
					properties: {
						query: { type: "string", description: "Text search query" },
						category: { type: "string", description: "Filter by category" },
						type: {
							type: "string",
							enum: ["income", "expense"],
							description: "Filter by type",
						},
						minAmount: { type: "number", description: "Minimum amount" },
						maxAmount: { type: "number", description: "Maximum amount" },
						from: { type: "string", description: "Start date (YYYY-MM-DD)" },
						to: { type: "string", description: "End date (YYYY-MM-DD)" },
					},
				},
			},
		},
	];

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

			const groqModels = [
				"groq/compound-mini",
				"llama-3.3-70b-versatile",
				"moonshotai/kimi-k2-instruct",
				"openai/gpt-oss-safeguard-20b",
			];

			for (const model of groqModels) {
				try {
					console.log(`Groq: Attempting model: ${model}`);
					const completion = await groq.chat.completions.create({
						messages: messages,
						model: model,
						tools: tools,
						tool_choice: "auto",
					});

					const choice = completion.choices[0];
					const responseMessage = choice.message;

					// Handle Tool Calls
					if (
						responseMessage.tool_calls &&
						responseMessage.tool_calls.length > 0
					) {
						const toolCall = responseMessage.tool_calls[0] as any;
						if (toolCall.function?.name === "create_transaction") {
							try {
								const args = JSON.parse(toolCall.function.arguments);
								console.log("Executing create_transaction with args:", args);

								await CreateTransaction({
									amount: args.amount,
									description: args.description || "AI Created Transaction",
									date: new Date(args.date),
									category: args.category,
									type: args.type,
								});

								// Impact Analysis Logic
								const [updatedBudgets, updatedSavingsGoals] = await Promise.all(
									[
										prisma.budget.findMany({
											where: { userId: user.id },
											select: { category: true, amount: true },
										}),
										prisma.savingsGoal.findMany({
											where: { userId: user.id, isCompleted: false },
											select: {
												name: true,
												targetAmount: true,
												currentAmount: true,
											},
										}),
									],
								);

								let impactMessage = "";
								if (args.type === "expense") {
									const categoryBudget = updatedBudgets.find(
										(b) => b.category === args.category,
									);
									if (categoryBudget) {
										const monthTransactions = await prisma.transaction.findMany(
											{
												where: {
													userId: user.id,
													category: args.category,
													date: {
														gte: new Date(
															new Date().getFullYear(),
															new Date().getMonth(),
															1,
														),
													},
												},
												select: { amount: true },
											},
										);
										const totalSpent = monthTransactions.reduce(
											(sum, t) => sum + t.amount,
											0,
										);
										const remaining = categoryBudget.amount - totalSpent;
										impactMessage +=
											remaining < 0
												? `\n\n⚠️ **Budget Warning**: You've exceeded your ${args.category} budget by ${Math.abs(remaining).toFixed(2)} ${currency}.`
												: `\n\n📊 **Budget Status**: ${remaining.toFixed(2)} ${currency} left in your ${args.category} monthly budget.`;
									}
									if (updatedSavingsGoals.length > 0) {
										const totalIncome = await prisma.transaction.aggregate({
											where: {
												userId: user.id,
												type: "income",
												date: {
													gte: new Date(
														new Date().getFullYear(),
														new Date().getMonth(),
														1,
													),
												},
											},
											_sum: { amount: true },
										});
										const totalExpenses = await prisma.transaction.aggregate({
											where: {
												userId: user.id,
												type: "expense",
												date: {
													gte: new Date(
														new Date().getFullYear(),
														new Date().getMonth(),
														1,
													),
												},
											},
											_sum: { amount: true },
										});
										if (
											(totalIncome._sum.amount || 0) <
											(totalExpenses._sum.amount || 0)
										) {
											impactMessage += `\n\n🎯 **Goal Impact**: Your monthly spending currently exceeds your income. This may delay your "${updatedSavingsGoals[0].name}" goal.`;
										}
									}
								}

								return {
									text: `✅ Successfully created a ${args.type} of ${args.amount} ${currency} for "${args.description || "items"}" under ${args.category}.${impactMessage}`,
								};
							} catch (err: any) {
								console.error("Tool Execution Error:", err);
								return {
									text: `❌ Failed to create transaction: ${err.message}`,
								};
							}
						}

						if (toolCall.function?.name === "search_transactions") {
							const args = JSON.parse(toolCall.function.arguments);
							console.log("Applying filters via AI:", args);
							return {
								text: `🔍 I've found those records for you! I'm updating your view with the requested filters: ${args.query || args.category || "criteria"}.`,
								filter: args,
							};
						}
					}

					const text = responseMessage.content || "";
					console.log(`Groq: Success with ${model}`);
					return { text };
				} catch (innerError: any) {
					console.error(`Groq Model ${model} failed:`, innerError.message);
					// Continue loop to next Groq model
				}
			}
		} catch (error: any) {
			console.error("Groq Setup Error:", error.message);
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
				"moonshotai/kimi-k2-instruct",
				"deepseek/deepseek-r1-0528:free",
				"meta-llama/llama-3.3-70b-instruct:free",
				"qwen/qwen3-coder:free",
				"openai/gpt-oss-safeguard-20b",
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
					// Note: OpenRouter support for tools varies by model.
					// For simplicity, we fallback to text-only for OpenRouter or attempt tools if supported.
					// Llama 3.3 70b Instruct usually supports tools.

					const completion = await client.chat.completions.create({
						model: model,
						messages: messages,
						tools: tools,
					});

					const choice = completion.choices[0];
					const responseMessage = choice.message;

					if (
						responseMessage.tool_calls &&
						responseMessage.tool_calls.length > 0
					) {
						const toolCall = responseMessage.tool_calls[0] as any;
						if (toolCall.function?.name === "create_transaction") {
							try {
								const args = JSON.parse(toolCall.function.arguments);
								await CreateTransaction({
									amount: args.amount,
									description: args.description || "AI Created Transaction",
									date: new Date(args.date),
									category: args.category,
									type: args.type,
								});

								// Impact Analysis Logic
								const [updatedBudgets, updatedSavingsGoals] = await Promise.all(
									[
										prisma.budget.findMany({
											where: { userId: user.id },
											select: { category: true, amount: true },
										}),
										prisma.savingsGoal.findMany({
											where: { userId: user.id, isCompleted: false },
											select: {
												name: true,
												targetAmount: true,
												currentAmount: true,
											},
										}),
									],
								);

								let impactMessage = "";
								if (args.type === "expense") {
									const categoryBudget = updatedBudgets.find(
										(b) => b.category === args.category,
									);
									if (categoryBudget) {
										const monthTransactions = await prisma.transaction.findMany(
											{
												where: {
													userId: user.id,
													category: args.category,
													date: {
														gte: new Date(
															new Date().getFullYear(),
															new Date().getMonth(),
															1,
														),
													},
												},
												select: { amount: true },
											},
										);
										const totalSpent = monthTransactions.reduce(
											(sum, t) => sum + t.amount,
											0,
										);
										const remaining = categoryBudget.amount - totalSpent;
										impactMessage +=
											remaining < 0
												? `\n\n⚠️ **Budget Warning**: You've exceeded your ${args.category} budget by ${Math.abs(remaining).toFixed(2)} ${currency}.`
												: `\n\n📊 **Budget Status**: ${remaining.toFixed(2)} ${currency} left in your ${args.category} monthly budget.`;
									}
									if (updatedSavingsGoals.length > 0) {
										const totalIncome = await prisma.transaction.aggregate({
											where: {
												userId: user.id,
												type: "income",
												date: {
													gte: new Date(
														new Date().getFullYear(),
														new Date().getMonth(),
														1,
													),
												},
											},
											_sum: { amount: true },
										});
										const totalExpenses = await prisma.transaction.aggregate({
											where: {
												userId: user.id,
												type: "expense",
												date: {
													gte: new Date(
														new Date().getFullYear(),
														new Date().getMonth(),
														1,
													),
												},
											},
											_sum: { amount: true },
										});
										if (
											(totalIncome._sum.amount || 0) <
											(totalExpenses._sum.amount || 0)
										) {
											impactMessage += `\n\n🎯 **Goal Impact**: Your monthly spending currently exceeds your income. This may delay your "${updatedSavingsGoals[0].name}" goal.`;
										}
									}
								}

								return {
									text: `✅ Successfully created a ${args.type} of ${args.amount} ${currency} for "${args.description || "items"}" under ${args.category}.${impactMessage}`,
								};
							} catch (err: any) {
								return {
									text: `❌ Failed to create transaction: ${err.message}`,
								};
							}
						}

						if (toolCall.function?.name === "search_transactions") {
							const args = JSON.parse(toolCall.function.arguments);
							return {
								text: `🔍 Querying your records... I've found what you were looking for and filtered your view accordingly!`,
								filter: args,
							};
						}
					}

					const text = responseMessage.content || "";
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
