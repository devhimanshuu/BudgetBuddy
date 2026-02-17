import prisma from "@/lib/prisma";

export type PersonaType = "Squirrel" | "Peacock" | "Owl" | "Fox";

export interface PersonaData {
	persona: PersonaType;
	personality: string;
	healthScore: number;
	metrics: {
		savingsRate: number;
		luxuryRate: number;
		budgetAdherence: number;
	};
	insights: string[];
	quote: {
		text: string;
		author: string;
	};
}

export const PERSONA_THEME = {
	Squirrel: {
		icon: "🐿️",
		color: "text-emerald-500",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
		trait: "The Wealth Builder",
		gradient: "from-emerald-400 to-emerald-600",
	},
	Peacock: {
		icon: "🦚",
		color: "text-rose-500",
		bg: "bg-rose-500/10",
		border: "border-rose-500/20",
		trait: "The Luxury Spender",
		gradient: "from-rose-400 to-pink-600",
	},
	Owl: {
		icon: "🦉",
		color: "text-blue-500",
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
		trait: "The Strategist",
		gradient: "from-blue-400 to-indigo-600",
	},
	Fox: {
		icon: "🦊",
		color: "text-amber-500",
		bg: "bg-amber-500/10",
		border: "border-amber-500/20",
		trait: "The Balanced",
		gradient: "from-amber-400 to-orange-600",
	},
};

const QUOTES = [
	{
		text: "Do not save what is left after spending, but spend what is left after saving.",
		author: "Warren Buffett",
	},
	{
		text: "A budget is telling your money where to go instead of wondering where it went.",
		author: "Dave Ramsey",
	},
	{
		text: "The art is not in making money, but in keeping it.",
		author: "Old Proverb",
	},
	{
		text: "Beware of little expenses; a small leak will sink a great ship.",
		author: "Benjamin Franklin",
	},
	{
		text: "Financial freedom is available to those who learn about it and work for it.",
		author: "Robert Kiyosaki",
	},
	{
		text: "Money is a terrible master but an excellent servant.",
		author: "P.T. Barnum",
	},
	{
		text: "It’s not how much money you make, but how much money you keep.",
		author: "Robert Kiyosaki",
	},
	{
		text: "Rich people stay rich by living like they're broke. Broke people stay broke by living like they're rich.",
		author: "Unknown",
	},
	{
		text: "The quickest way to double your money is to fold it over and put it back in your pocket.",
		author: "Will Rogers",
	},
	{
		text: "You must gain control over your money or the lack of it will forever control you.",
		author: "Dave Ramsey",
	},
	{
		text: "Wealth consists not in having great possessions, but in having few wants.",
		author: "Epictetus",
	},
	{
		text: "He who loses money, loses much; He who loses a friend, loses much more; He who loses faith, loses all.",
		author: "Eleanor Roosevelt",
	},
	{
		text: "Formal education will make you a living; self-education will make you a fortune.",
		author: "Jim Rohn",
	},
	{
		text: "Opportunity is missed by most people because it is dressed in overalls and looks like work.",
		author: "Thomas Edison",
	},
	{
		text: "Too many people spend money they haven't earned, to buy things they don't want, to impress people they don't like.",
		author: "Will Rogers",
	},
];

function getDailyQuote() {
	// Simple hash of the date to pick a consistent quote for the day
	const today = new Date().toDateString();
	let hash = 0;
	for (let i = 0; i < today.length; i++) {
		hash = today.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % QUOTES.length;
	return QUOTES[index];
}

export async function getPersona(userId: string): Promise<PersonaData> {
	const twoMonthsAgo = new Date();
	twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

	const [transactions, budgets] = await Promise.all([
		prisma.transaction.findMany({
			where: {
				userId: userId,
				date: {
					gte: twoMonthsAgo,
				},
			},
			orderBy: { date: "desc" },
		}),
		prisma.budget.findMany({
			where: { userId: userId },
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

	return {
		persona,
		personality: personaPersonality,
		healthScore,
		metrics: {
			savingsRate,
			luxuryRate,
			budgetAdherence,
		},
		insights,
		quote: getDailyQuote(),
	};
}
