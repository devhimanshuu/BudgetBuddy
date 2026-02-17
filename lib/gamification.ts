import prisma from "@/lib/prisma";
import { differenceInDays, startOfDay } from "date-fns";

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

/**
 * Update user's streak based on their last activity
 */
export async function updateStreak(userId: string): Promise<{
	currentStreak: number;
	longestStreak: number;
	isNewRecord: boolean;
}> {
	const userSettings = await prisma.userSettings.findUnique({
		where: { userId },
	});

	if (!userSettings) {
		throw new Error("User settings not found");
	}

	const today = startOfDay(new Date());
	const lastActivity = userSettings.lastActivityDate
		? startOfDay(userSettings.lastActivityDate)
		: null;

	let currentStreak = userSettings.currentStreak;
	let longestStreak = userSettings.longestStreak;

	if (!lastActivity) {
		// First activity ever
		currentStreak = 1;
	} else {
		const daysSinceLastActivity = differenceInDays(today, lastActivity);

		if (daysSinceLastActivity === 0) {
			// Same day - no change
			return { currentStreak, longestStreak, isNewRecord: false };
		} else if (daysSinceLastActivity === 1) {
			// Consecutive day - increment streak
			currentStreak += 1;
		} else {
			// Streak broken - reset to 1
			currentStreak = 1;
		}
	}

	// Update longest streak if current is higher
	const isNewRecord = currentStreak > longestStreak;
	if (isNewRecord) {
		longestStreak = currentStreak;
	}

	// Update database
	await prisma.userSettings.update({
		where: { userId },
		data: {
			currentStreak,
			longestStreak,
			lastActivityDate: today,
		},
	});

	return { currentStreak, longestStreak, isNewRecord };
}

/**
 * Check and unlock achievements for a user
 * Returns the LIST of achievements unlocked in this specific check
 */
export async function checkAchievements(
	userId: string,
	context: {
		type: "transaction" | "budget" | "savings_goal" | "streak";
		data?: any;
	},
): Promise<AchievementDef[]> {
	const unlockedAchievements: AchievementDef[] = [];

	try {
		// Get user's existing achievements
		const existingAchievements = await prisma.userAchievement.findMany({
			where: { userId },
			include: { achievement: true },
		});

		const existingKeys = new Set(
			existingAchievements.map((ua) => ua.achievement.key),
		);

		// Check transaction-based achievements
		if (context.type === "transaction") {
			const transactionCount = await prisma.transaction.count({
				where: { userId },
			});

			const achievementsToCheck = [
				{ count: 1, achievement: ACHIEVEMENTS.FIRST_TRANSACTION },
				{ count: 10, achievement: ACHIEVEMENTS.TRANSACTIONS_10 },
				{ count: 50, achievement: ACHIEVEMENTS.TRANSACTIONS_50 },
				{ count: 100, achievement: ACHIEVEMENTS.TRANSACTIONS_100 },
				{ count: 1000, achievement: ACHIEVEMENTS.TRANSACTIONS_1000 },
			];

			for (const { count, achievement } of achievementsToCheck) {
				if (transactionCount >= count && !existingKeys.has(achievement.key)) {
					await unlockAchievement(userId, achievement);
					unlockedAchievements.push(achievement);
				}
			}

			// Check time-based achievements
			const hour = new Date().getHours();
			if (hour < 8 && !existingKeys.has(ACHIEVEMENTS.EARLY_BIRD.key)) {
				await unlockAchievement(userId, ACHIEVEMENTS.EARLY_BIRD);
				unlockedAchievements.push(ACHIEVEMENTS.EARLY_BIRD);
			}
			if (hour >= 22 && !existingKeys.has(ACHIEVEMENTS.NIGHT_OWL.key)) {
				await unlockAchievement(userId, ACHIEVEMENTS.NIGHT_OWL);
				unlockedAchievements.push(ACHIEVEMENTS.NIGHT_OWL);
			}
		}

		// Check streak achievements
		if (context.type === "streak") {
			const userSettings = await prisma.userSettings.findUnique({
				where: { userId },
			});

			if (userSettings) {
				const streakAchievements = [
					{ streak: 3, achievement: ACHIEVEMENTS.STREAK_3 },
					{ streak: 7, achievement: ACHIEVEMENTS.STREAK_7 },
					{ streak: 30, achievement: ACHIEVEMENTS.STREAK_30 },
					{ streak: 100, achievement: ACHIEVEMENTS.STREAK_100 },
				];

				for (const { streak, achievement } of streakAchievements) {
					if (
						userSettings.currentStreak >= streak &&
						!existingKeys.has(achievement.key)
					) {
						await unlockAchievement(userId, achievement);
						unlockedAchievements.push(achievement);
					}
				}
			}
		}

		// Check savings goal achievements
		if (context.type === "savings_goal") {
			const completedGoals = await prisma.savingsGoal.count({
				where: { userId, isCompleted: true },
			});

			const goalAchievements = [
				{ count: 1, achievement: ACHIEVEMENTS.SAVINGS_GOAL_1 },
				{ count: 5, achievement: ACHIEVEMENTS.SAVINGS_GOAL_5 },
			];

			for (const { count, achievement } of goalAchievements) {
				if (completedGoals >= count && !existingKeys.has(achievement.key)) {
					await unlockAchievement(userId, achievement);
					unlockedAchievements.push(achievement);
				}
			}
		}

		// Check budget/monthly history achievements
		if (context.type === "budget" || context.type === "transaction") {
			const monthlyHistory = await prisma.monthlyHistory.findMany({
				where: { userId },
				orderBy: { year: "desc", month: "desc" },
			});

			const currentMonth = new Date().getUTCMonth();
			const currentYear = new Date().getUTCFullYear();

			// Filter for completed months (months before current)
			const completedMonths = monthlyHistory.filter(
				(m) =>
					m.year < currentYear ||
					(m.year === currentYear && m.month < currentMonth),
			);

			// Count consecutive months where Income >= Expense
			let consecutive = 0;
			// Iterate from most recent backwards
			for (const m of completedMonths) {
				if (m.income >= m.expense) {
					consecutive++;
				} else {
					break;
				}
			}

			const budgetAchievements = [
				{ count: 1, achievement: ACHIEVEMENTS.BUDGET_HERO_1 },
				{ count: 3, achievement: ACHIEVEMENTS.BUDGET_HERO_3 },
				{ count: 6, achievement: ACHIEVEMENTS.BUDGET_HERO_6 },
			];

			for (const { count, achievement } of budgetAchievements) {
				if (consecutive >= count && !existingKeys.has(achievement.key)) {
					await unlockAchievement(userId, achievement);
					unlockedAchievements.push(achievement);
				}
			}
		}

		return unlockedAchievements;
	} catch (error) {
		console.error("Error checking achievements:", error);
		return [];
	}
}

/**
 * Unlock an achievement for a user
 */
async function unlockAchievement(
	userId: string,
	achievementDef: (typeof ACHIEVEMENTS)[keyof typeof ACHIEVEMENTS],
) {
	// Ensure achievement exists in database
	let achievement = await prisma.achievement.findUnique({
		where: { key: achievementDef.key },
	});

	if (!achievement) {
		achievement = await prisma.achievement.create({
			data: achievementDef,
		});
	}

	// Check if already unlocked (redundant safety)
	const existing = await prisma.userAchievement.findUnique({
		where: {
			userId_achievementId: {
				userId,
				achievementId: achievement.id,
			},
		},
	});

	if (existing) return;

	// Create user achievement
	await prisma.userAchievement.create({
		data: {
			userId,
			achievementId: achievement.id,
		},
	});

	// Award points
	await prisma.userSettings.update({
		where: { userId },
		data: {
			totalPoints: {
				increment: achievementDef.points,
			},
		},
	});
}

/**
 * Get user's gamification stats
 */
export async function getGamificationStats(userId: string) {
	const [userSettings, achievements, transactionCount] = await Promise.all([
		prisma.userSettings.findUnique({ where: { userId } }),
		prisma.userAchievement.findMany({
			where: { userId },
			include: { achievement: true },
			orderBy: { unlockedAt: "desc" },
		}),
		prisma.transaction.count({ where: { userId } }),
	]);

	const totalPoints = userSettings?.totalPoints || 0;
	const levelInfo = calculateLevel(totalPoints);

	return {
		currentStreak: userSettings?.currentStreak || 0,
		longestStreak: userSettings?.longestStreak || 0,
		totalPoints,
		level: levelInfo.currentLevel,
		nextLevel: levelInfo.nextLevel,
		levelProgress: levelInfo.progress,
		achievements: achievements.map((ua) => ({
			...ua.achievement,
			unlockedAt: ua.unlockedAt,
		})),
		totalAchievements: achievements.length,
		totalTransactions: transactionCount,
	};
}
