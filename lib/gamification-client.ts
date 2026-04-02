
// Level definitions
export const LEVELS = [
	{
		level: 1,
		minPoints: 0,
		title: "Novice Saver",
		color: "text-slate-400",
		tier: "Bronze",
	},
	{
		level: 2,
		minPoints: 100,
		title: "Budget Beginner",
		color: "text-slate-300",
		tier: "Bronze",
	},
	{
		level: 3,
		minPoints: 300,
		title: "Smart Spender",
		color: "text-slate-200",
		tier: "Bronze",
	},
	{
		level: 4,
		minPoints: 600,
		title: "Finance Fanatic",
		color: "text-amber-600",
		tier: "Silver",
	},
	{
		level: 5,
		minPoints: 1000,
		title: "Wealth Wizard",
		color: "text-amber-500",
		tier: "Silver",
	},
	{
		level: 6,
		minPoints: 1500,
		title: "Investment Icon",
		color: "text-amber-400",
		tier: "Silver",
	},
	{
		level: 7,
		minPoints: 2200,
		title: "Money Master",
		color: "text-yellow-500",
		tier: "Gold",
	},
	{
		level: 8,
		minPoints: 3000,
		title: "Fiscal Legend",
		color: "text-yellow-400",
		tier: "Gold",
	},
	{
		level: 9,
		minPoints: 4000,
		title: "Tycoon",
		color: "text-cyan-400",
		tier: "Platinum",
	},
	{
		level: 10,
		minPoints: 5000,
		title: "Grand Tycoon",
		color: "text-purple-500",
		tier: "Mythic",
	},
] as const;

export const UNLOCKS = [
	{
		level: 2,
		type: "theme",
		name: "Midnight Neon",
		description: "Unlocks a vibrant dark theme with neon accents.",
	},
	{
		level: 3,
		type: "icons",
		name: "Premium Pack",
		description: "Unlocks 50+ hand-crafted financial category icons.",
	},
	{
		level: 4,
		type: "feature",
		name: "Anomaly Detection",
		description: "AI will now alert you to unusual spending patterns.",
	},
	{
		level: 5,
		type: "theme",
		name: "Glassmorphism Pro",
		description: "Unlocks a premium frosted-glass UI aesthetic.",
	},
	{
		level: 7,
		type: "feature",
		name: "Advanced PDF Reports",
		description: "Export high-end financial summaries with charts.",
	},
	{
		level: 8,
		type: "theme",
		name: "Gold Standard",
		description: "A luxurious interface for the financial elite.",
	},
	{
		level: 10,
		type: "powerup",
		name: "AI Strategy Engine",
		description: "Unlocks deep financial foresight and 'What-If' simulations.",
	},
] as const;

export function calculateLevel(points: number) {
	const level =
		LEVELS.slice()
			.reverse()
			.find((l) => points >= l.minPoints) || LEVELS[0];
	const nextLevel = LEVELS.find((l) => l.level === level.level + 1);

	const unlockedFeatures = UNLOCKS.filter((u) => u.level <= level.level);
	const nextUnlock = UNLOCKS.find((u) => u.level > level.level);

	return {
		currentLevel: level,
		nextLevel,
		progress: nextLevel
			? ((points - level.minPoints) / (nextLevel.minPoints - level.minPoints)) *
				100
			: 100,
		tier: level.tier,
		unlockedFeatures,
		nextUnlock,
	};
}

// Achievement definitions
export const ACHIEVEMENTS = {
	// Streak achievements
	STREAK_3: {
		key: "streak_3",
		name: "Getting Started",
		description: "Log transactions for 3 days in a row",
		icon: "🔥",
		category: "streak",
		tier: "bronze",
		points: 10,
		requirement: 3,
	},
	STREAK_7: {
		key: "streak_7",
		name: "Week Warrior",
		description: "Log transactions for 7 days in a row",
		icon: "🔥",
		category: "streak",
		tier: "silver",
		points: 25,
		requirement: 7,
	},
	STREAK_30: {
		key: "streak_30",
		name: "Monthly Master",
		description: "Log transactions for 30 days in a row",
		icon: "🔥",
		category: "streak",
		tier: "gold",
		points: 100,
		requirement: 30,
	},
	STREAK_100: {
		key: "streak_100",
		name: "Century Club",
		description: "Log transactions for 100 days in a row",
		icon: "🔥",
		category: "streak",
		tier: "platinum",
		points: 500,
		requirement: 100,
	},

	// Transaction milestones
	FIRST_TRANSACTION: {
		key: "first_transaction",
		name: "First Step",
		description: "Create your first transaction",
		icon: "🎯",
		category: "general",
		tier: "bronze",
		points: 5,
		requirement: 1,
	},
	TRANSACTIONS_10: {
		key: "transactions_10",
		name: "Getting the Hang of It",
		description: "Create 10 transactions",
		icon: "📊",
		category: "general",
		tier: "bronze",
		points: 15,
		requirement: 10,
	},
	TRANSACTIONS_50: {
		key: "transactions_50",
		name: "Power User",
		description: "Create 50 transactions",
		icon: "⚡",
		category: "general",
		tier: "bronze",
		points: 30,
		requirement: 50,
	},
	TRANSACTIONS_100: {
		key: "transactions_100",
		name: "Transaction Pro",
		description: "Create 100 transactions",
		icon: "📈",
		category: "general",
		tier: "silver",
		points: 50,
		requirement: 100,
	},
	TRANSACTIONS_1000: {
		key: "transactions_1000",
		name: "Data Master",
		description: "Create 1000 transactions",
		icon: "💎",
		category: "general",
		tier: "gold",
		points: 200,
		requirement: 1000,
	},

	// Budget achievements
	BUDGET_HERO_1: {
		key: "budget_hero_1",
		name: "Budget Conscious",
		description: "Spend less than you earn for 1 month",
		icon: "🏆",
		category: "budget",
		tier: "bronze",
		points: 20,
		requirement: 1,
	},
	BUDGET_HERO_3: {
		key: "budget_hero_3",
		name: "Budget Hero",
		description: "Spend less than you earn for 3 months in a row",
		icon: "🏆",
		category: "budget",
		tier: "silver",
		points: 75,
		requirement: 3,
	},
	BUDGET_HERO_6: {
		key: "budget_hero_6",
		name: "Budget Champion",
		description: "Spend less than you earn for 6 months in a row",
		icon: "🏆",
		category: "budget",
		tier: "gold",
		points: 150,
		requirement: 6,
	},

	// Savings achievements
	SAVINGS_GOAL_1: {
		key: "savings_goal_1",
		name: "Goal Getter",
		description: "Complete your first savings goal",
		icon: "💰",
		category: "savings",
		tier: "bronze",
		points: 30,
		requirement: 1,
	},
	SAVINGS_GOAL_5: {
		key: "savings_goal_5",
		name: "Dream Achiever",
		description: "Complete 5 savings goals",
		icon: "💰",
		category: "savings",
		tier: "silver",
		points: 100,
		requirement: 5,
	},

	// Investment achievements
	FIRST_INVESTMENT: {
		key: "first_investment",
		name: "Wealth Builder",
		description: "Create your first investment transaction",
		icon: "🔋",
		category: "investment",
		tier: "bronze",
		points: 15,
		requirement: 1,
	},
	INVESTMENT_MILESTONE_1000: {
		key: "investment_1000",
		name: "Active Investor",
		description: "Reach $1,000 in total investments",
		icon: "📈",
		category: "investment",
		tier: "silver",
		points: 50,
		requirement: 1000,
	},
	INVESTMENT_MILESTONE_10000: {
		key: "investment_10000",
		name: "Portfolio Powerhouse",
		description: "Reach $10,000 in total investments",
		icon: "💎",
		category: "investment",
		tier: "gold",
		points: 200,
		requirement: 10000,
	},

	// Special achievements
	EARLY_BIRD: {
		key: "early_bird",
		name: "Early Bird",
		description: "Log a transaction before 8 AM",
		icon: "🌅",
		category: "general",
		tier: "bronze",
		points: 10,
		requirement: 1,
	},
	NIGHT_OWL: {
		key: "night_owl",
		name: "Night Owl",
		description: "Log a transaction after 10 PM",
		icon: "🦉",
		category: "general",
		tier: "bronze",
		points: 10,
		requirement: 1,
	},
} as const;

export type AchievementKey = keyof typeof ACHIEVEMENTS;
export type AchievementDef = (typeof ACHIEVEMENTS)[AchievementKey];
