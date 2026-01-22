"use client";

import { useQuery } from "@tanstack/react-query";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoricalData {
  month: string;
  year: number;
  spent: number;
}

interface BudgetHistoryProps {
  category: string;
  currentSpent: number;
  userSettings: UserSettings;
}

export default function BudgetHistory({
  category,
  currentSpent,
  userSettings,
}: BudgetHistoryProps) {
  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const { data: historicalData, isLoading } = useQuery<HistoricalData[]>({
    queryKey: ["budget-history", category],
    queryFn: () =>
      fetch(`/api/budgets/history?category=${encodeURIComponent(category)}&monthsBack=6`).then(
        (res) => res.json()
      ),
  });

  if (isLoading || !historicalData || historicalData.length === 0) {
    return null;
  }

  // Get last month's spending (second to last in array, last is current month)
  const lastMonthData = historicalData[historicalData.length - 2];
  const lastMonthSpent = lastMonthData?.spent || 0;
  const difference = currentSpent - lastMonthSpent;
  const percentageChange = lastMonthSpent > 0 ? (difference / lastMonthSpent) * 100 : 0;

  // Calculate max value for scaling the sparkline
  const maxSpent = Math.max(...historicalData.map((d) => d.spent), currentSpent);
  const minSpent = Math.min(...historicalData.map((d) => d.spent), 0);
  const range = maxSpent - minSpent || 1;

  return (
    <div className="mt-3 space-y-2 border-t pt-2">
      {/* Sparkline */}
      <div className="flex items-end gap-1 h-8">
        {historicalData.map((data, index) => {
          const height = ((data.spent - minSpent) / range) * 100;
          const isCurrentMonth = index === historicalData.length - 1;
          
          return (
            <div
              key={`${data.month}-${data.year}`}
              className="flex-1 flex flex-col justify-end"
              title={`${data.month}: ${formatter.format(data.spent)}`}
            >
              <div
                className={cn(
                  "w-full rounded-t transition-all",
                  isCurrentMonth
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Comparison with last month */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">vs Last Month:</span>
        <div className="flex items-center gap-1">
          {difference > 0 ? (
            <>
              <TrendingUp className="h-3 w-3 text-red-500" />
              <span className="font-medium text-red-600 dark:text-red-400">
                +{formatter.format(Math.abs(difference))}
              </span>
            </>
          ) : difference < 0 ? (
            <>
              <TrendingDown className="h-3 w-3 text-emerald-500" />
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                -{formatter.format(Math.abs(difference))}
              </span>
            </>
          ) : (
            <>
              <Minus className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">No change</span>
            </>
          )}
          {percentageChange !== 0 && (
            <span
              className={cn(
                "text-xs",
                difference > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              ({percentageChange > 0 ? "+" : ""}
              {percentageChange.toFixed(0)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
