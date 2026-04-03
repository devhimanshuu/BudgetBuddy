
export type PersonaType = "Squirrel" | "Peacock" | "Owl" | "Fox";

export interface PersonaData {
	persona: PersonaType;
	personality: string;
	healthScore: number;
	tier: string;
	level: number;
	points: number;
	levelProgress: number;
	nextUnlock?: {
		level: number;
		name: string;
		description: string;
	};
	metrics: {
		savingsRate: number;
		luxuryRate: number;
		budgetAdherence: number;
	};
	insights: string[];
	unlockedList: string;
	aiPrompt: string;
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
		voice: { pitch: 1.4, rate: 1.1 },
	},
	Peacock: {
		icon: "🦚",
		color: "text-rose-500",
		bg: "bg-rose-500/10",
		border: "border-rose-500/20",
		trait: "The Luxury Spender",
		gradient: "from-rose-400 to-pink-600",
		voice: { pitch: 0.8, rate: 0.9 },
	},
	Owl: {
		icon: "🦉",
		color: "text-blue-500",
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
		trait: "The Strategist",
		gradient: "from-blue-400 to-indigo-600",
		voice: { pitch: 0.6, rate: 0.8 },
	},
	Fox: {
		icon: "🦊",
		color: "text-amber-500",
		bg: "bg-amber-500/10",
		border: "border-amber-500/20",
		trait: "The Balanced",
		gradient: "from-amber-400 to-orange-600",
		voice: { pitch: 1.0, rate: 1.2 },
	},
};

export const QUOTES = [
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

export function getDailyQuote() {
	// Simple hash of the date to pick a consistent quote for the day
	const today = new Date().toDateString();
	let hash = 0;
	for (let i = 0; i < today.length; i++) {
		hash = today.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % QUOTES.length;
	return QUOTES[index];
}
