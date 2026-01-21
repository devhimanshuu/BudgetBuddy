/**
 * Hook to check budget alerts before creating a transaction
 */

import { useQuery } from "@tanstack/react-query";
import { AlertLevel } from "./budgetAlerts";

interface BudgetAlertResponse {
	hasAlert: boolean;
	alert?: {
		level: AlertLevel;
		message: string;
		category: string;
		categoryIcon: string;
		budgetAmount: number;
		spent: number;
		percentage: number;
		remaining: number;
	};
}

export function useCheckBudgetAlert(
	category: string | undefined,
	amount: number | undefined,
	enabled: boolean = true,
) {
	return useQuery<BudgetAlertResponse>({
		queryKey: ["budget-alert", category, amount],
		queryFn: async () => {
			if (!category || !amount) {
				return { hasAlert: false };
			}

			const response = await fetch(
				`/api/budgets/check-alert?category=${encodeURIComponent(
					category,
				)}&amount=${amount}`,
			);

			if (!response.ok) {
				throw new Error("Failed to check budget alert");
			}

			return response.json();
		},
		enabled: enabled && !!category && !!amount && amount > 0,
		staleTime: 0, // Always fetch fresh data
		gcTime: 0, // Don't cache
	});
}
