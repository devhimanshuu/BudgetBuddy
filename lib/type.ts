export type TransactionType = "income" | "expense";
export type TimeFrame = "month" | "year";
export type Period = { year: number; month: number };

export interface CalendarTransaction {
	id: string;
	amount: number;
	description: string;
	notes: string | null;
	date: Date | string;
	type: TransactionType;
	category: string;
	categoryIcon: string;
}

export interface CalendarDayData {
	income: number;
	expense: number;
	count: number;
	isHighSpending: boolean;
	transactions: CalendarTransaction[];
}

export interface CalendarMonthStats {
	totalIncome: number;
	totalExpense: number;
	avgDailyExpense: number;
	highSpendingThreshold: number;
}

export interface CalendarData {
	days: Record<string, CalendarDayData>;
	monthStats: CalendarMonthStats;
}
