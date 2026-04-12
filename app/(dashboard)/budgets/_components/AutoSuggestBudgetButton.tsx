"use client";

import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface AutoSuggestBudgetButtonProps {
	month: number;
	year: number;
}

export default function AutoSuggestBudgetButton({
	month,
	year,
}: AutoSuggestBudgetButtonProps) {
	const queryClient = useQueryClient();

	const autoSuggestMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch("/api/budgets/auto-suggest", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					month,
					year,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || error.error || "Failed to auto-suggest budget");
			}

			return response.json();
		},
		onSuccess: (data) => {
			toast.success("Budget Auto-Suggested ✨", {
				description: data.message,
			});
			queryClient.invalidateQueries({ queryKey: ["budget-progress"] });
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="secondary"
						onClick={() => autoSuggestMutation.mutate()}
						disabled={autoSuggestMutation.isPending}
						className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-900/50"
					>
						<Sparkles className="mr-2 h-4 w-4" />
						<span className="hidden lg:inline">
							{autoSuggestMutation.isPending ? "Analyzing..." : "Auto-Suggest"}
						</span>
						<span className="lg:hidden">
							{autoSuggestMutation.isPending ? "Analyzing..." : "Auto"}
						</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Calculates your 3-month average to build your budget instantly.</p>
					<p className="text-xs text-muted-foreground mt-1">Discretionary spending is cut by 5% to boost savings.</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
