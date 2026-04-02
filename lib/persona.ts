import prisma from "@/lib/prisma";
import { calculateLevel } from "./gamification-client";
import {
	type PersonaType,
	type PersonaData,
	PERSONA_THEME,
	QUOTES,
	getDailyQuote,
} from "./persona-client";

export {
	type PersonaType,
	type PersonaData,
	PERSONA_THEME,
	QUOTES,
	getDailyQuote,
};

export async function getPersona(userId: string, workspaceId?: string): Promise<PersonaData> {
	const twoMonthsAgo = new Date();
	twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

	const [transactions, budgets, userSettings] = await Promise.all([
		prisma.transaction.findMany({
			where: {
				...(workspaceId ? { workspaceId } : { userId: userId }),
				date: {
					gte: twoMonthsAgo,
				},
			},
			orderBy: { date: "desc" },
		}),
		prisma.budget.findMany({
			where: { ...(workspaceId ? { workspaceId } : { userId: userId }) },
		}),
		prisma.userSettings.findUnique({
			where: { userId },
		}),
	]);

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

	let persona: PersonaType = "Fox";
	let personaPersonality = "";
	const insights: string[] = [];

	if (savingsRate > 0.3) {
		persona = "Squirrel";
		personaPersonality =
			"The Wealth Builder. You are disciplined, protective, and focused on growing your stash.";
		insights.push("Great job saving! Your stash is growing.");
		if (luxuryRate > 0.2)
			insights.push("Watch out for small lifestyle creeps.");
	} else if (luxuryRate > 0.4) {
		persona = "Peacock";
		personaPersonality =
			"The Luxury Spender. You enjoy the finer things, but might need to watch the feathers.";
		insights.push("High spending on non-essentials detected.");
		insights.push("Consider cutting back on dining or shopping.");
	} else if (budgetAdherence > 0.9 && budgets.length > 0) {
		persona = "Owl";
		personaPersonality =
			"The Strategist. You are calm, calculated, and stick to your plans perfectly.";
		insights.push("Your budgeting is spot on.");
		insights.push("Time to set higher saving goals?");
	} else {
		persona = "Fox";
		personaPersonality =
			"The Balanced. You are agile, street-smart, and maintain a healthy equilibrium.";
		insights.push("You are balancing well, but could optimize more.");
	}

	const healthScore = Math.min(
		Math.max(
			Math.floor(savingsRate * 150 + budgetAdherence * 50 - luxuryRate * 100),
			0,
		),
		100,
	);

	const levelInfo = calculateLevel(userSettings?.totalPoints || 0);

	return {
		persona,
		personality: personaPersonality,
		healthScore,
		tier: levelInfo.tier,
		level: levelInfo.currentLevel.level,
		points: userSettings?.totalPoints || 0,
		levelProgress: levelInfo.progress,
		nextUnlock: levelInfo.nextUnlock,
		metrics: {
			savingsRate,
			luxuryRate,
			budgetAdherence,
		},
		insights: insights,
		quote: getDailyQuote(),
	};
}
