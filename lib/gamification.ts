import prisma from "@/lib/prisma";
import { differenceInDays, startOfDay } from "date-fns";
import {
	LEVELS,
	UNLOCKS,
	calculateLevel,
	ACHIEVEMENTS,
	type AchievementKey,
	type AchievementDef,
} from "./gamification-client";

export {
	LEVELS,
	UNLOCKS,
	calculateLevel,
	ACHIEVEMENTS,
	type AchievementKey,
	type AchievementDef,
};

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

		// Check investment-based achievements
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

			// Specific investment checks
			const investmentCount = await prisma.transaction.count({
				where: { userId, type: "investment" },
			});

			if (investmentCount >= 1 && !existingKeys.has(ACHIEVEMENTS.FIRST_INVESTMENT.key)) {
				await unlockAchievement(userId, ACHIEVEMENTS.FIRST_INVESTMENT);
				unlockedAchievements.push(ACHIEVEMENTS.FIRST_INVESTMENT);
			}

			const totalInvested = await prisma.transaction.aggregate({
				where: { userId, type: "investment" },
				_sum: { amount: true },
			});

			const investedAmount = totalInvested._sum.amount || 0;
			if (investedAmount >= 1000 && !existingKeys.has(ACHIEVEMENTS.INVESTMENT_MILESTONE_1000.key)) {
				await unlockAchievement(userId, ACHIEVEMENTS.INVESTMENT_MILESTONE_1000);
				unlockedAchievements.push(ACHIEVEMENTS.INVESTMENT_MILESTONE_1000);
			}
			if (investedAmount >= 10000 && !existingKeys.has(ACHIEVEMENTS.INVESTMENT_MILESTONE_10000.key)) {
				await unlockAchievement(userId, ACHIEVEMENTS.INVESTMENT_MILESTONE_10000);
				unlockedAchievements.push(ACHIEVEMENTS.INVESTMENT_MILESTONE_10000);
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

			// Count consecutive months where Income >= Expense + Investment
			let consecutive = 0;
			// Iterate from most recent backwards
			for (const m of completedMonths) {
				if (m.income >= (m.expense + (m.investment || 0))) {
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
