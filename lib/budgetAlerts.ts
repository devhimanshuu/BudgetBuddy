/**
 * Budget Alert System
 * Checks spending against budgets and triggers appropriate alerts
 */

export type AlertLevel = "none" | "warning" | "danger";

export interface BudgetAlert {
	level: AlertLevel;
	category: string;
	categoryIcon: string;
	budgetAmount: number;
	spent: number;
	percentage: number;
	remaining: number;
	message: string;
	dayOfMonth: number;
}

/**
 * Check if a budget has been exceeded or is near the limit
 */
export function checkBudgetStatus(
	category: string,
	categoryIcon: string,
	budgetAmount: number,
	spent: number,
	currentDate: Date = new Date(),
): BudgetAlert {
	const percentage = (spent / budgetAmount) * 100;
	const remaining = budgetAmount - spent;
	const dayOfMonth = currentDate.getDate();

	let level: AlertLevel = "none";
	let message = "";

	if (spent > budgetAmount) {
		// Over budget - RED ALERT
		level = "danger";
		message = `🚨 You have exceeded your ${category} budget by ${Math.abs(remaining).toFixed(2)}!`;
	} else if (percentage >= 80) {
		// Near limit (80%+) - YELLOW ALERT
		level = "warning";
		message = `⚠️ You've hit ${percentage.toFixed(0)}% of your ${category} budget and it's only day ${dayOfMonth}!`;
	}

	return {
		level,
		category,
		categoryIcon,
		budgetAmount,
		spent,
		percentage,
		remaining,
		message,
		dayOfMonth,
	};
}

/**
 * Get all budget alerts for a user's current spending
 */
export function getBudgetAlerts(
	budgets: Array<{
		category: string;
		categoryIcon: string;
		amount: number;
	}>,
	spendingByCategory: { [key: string]: number },
	currentDate: Date = new Date(),
): BudgetAlert[] {
	const alerts: BudgetAlert[] = [];

	budgets.forEach((budget) => {
		const spent = spendingByCategory[budget.category] || 0;
		const alert = checkBudgetStatus(
			budget.category,
			budget.categoryIcon,
			budget.amount,
			spent,
			currentDate,
		);

		// Only include alerts that have a warning or danger level
		if (alert.level !== "none") {
			alerts.push(alert);
		}
	});

	// Sort by severity (danger first, then warning)
	return alerts.sort((a, b) => {
		if (a.level === "danger" && b.level !== "danger") return -1;
		if (a.level !== "danger" && b.level === "danger") return 1;
		return b.percentage - a.percentage; // Higher percentage first
	});
}

/**
 * Format alert message for display
 */
export function formatAlertMessage(alert: BudgetAlert): string {
	return alert.message;
}

/**
 * Get alert color based on level
 */
export function getAlertColor(level: AlertLevel): string {
	switch (level) {
		case "danger":
			return "destructive";
		case "warning":
			return "warning";
		default:
			return "default";
	}
}
