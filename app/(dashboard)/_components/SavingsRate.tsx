"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { cn } from "@/lib/utils";

interface SavingsRateProps {
  userSettings: UserSettings;
}

interface SavingsData {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
  previousSavingsRate: number;
  rateChange: number;
}

export default function SavingsRate({ userSettings }: SavingsRateProps) {
  const savingsQuery = useQuery<SavingsData>({
    queryKey: ["savings-rate"],
    queryFn: () => fetch("/api/stats/savings").then((res) => res.json()),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const data = savingsQuery.data;
  const savingsRate = data?.savingsRate || 0;
  const savings = data?.savings || 0;
  const income = data?.income || 0;
  const rateChange = data?.rateChange || 0;

  // Determine savings health
  const getSavingsHealth = (rate: number) => {
    if (rate >= 20) return { label: "Excellent", color: "text-emerald-600" };
    if (rate >= 10) return { label: "Good", color: "text-blue-600" };
    if (rate >= 5) return { label: "Fair", color: "text-yellow-600" };
    if (rate > 0) return { label: "Low", color: "text-orange-600" };
    return { label: "Negative", color: "text-red-600" };
  };

  const health = getSavingsHealth(savingsRate);

  return (
    <SkeletonWrapper isLoading={savingsQuery.isFetching}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-emerald-500" />
              Savings Rate
            </div>
            {rateChange !== 0 && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm",
                  rateChange > 0 ? "text-emerald-500" : "text-red-500"
                )}
              >
                {rateChange > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(rateChange).toFixed(1)}%</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Savings Rate Display */}
          <div className="text-center">
            <p className={cn("text-5xl font-bold", health.color)}>
              {savingsRate.toFixed(1)}%
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              of income saved
            </p>
            <p className={cn("mt-2 text-sm font-medium", health.color)}>
              {health.label} Savings Rate
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress
              value={Math.min(savingsRate, 100)}
              className={cn(
                "h-3",
                savingsRate >= 20 && "[&>div]:bg-emerald-500",
                savingsRate >= 10 &&
                  savingsRate < 20 &&
                  "[&>div]:bg-blue-500",
                savingsRate >= 5 && savingsRate < 10 && "[&>div]:bg-yellow-500",
                savingsRate > 0 && savingsRate < 5 && "[&>div]:bg-orange-500",
                savingsRate <= 0 && "[&>div]:bg-red-500"
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>20% (Recommended)</span>
              <span>50%+</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 rounded-lg bg-muted p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Income</span>
              <span className="font-medium">{formatter.format(income)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Saved</span>
              <span
                className={cn(
                  "font-medium",
                  savings >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {formatter.format(savings)}
              </span>
            </div>
          </div>

          {/* Tips */}
          {savingsRate < 20 && income > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                💡 Tip
              </p>
              <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
                Financial experts recommend saving at least 20% of your income.
                Try to reduce expenses or increase income to reach this goal.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
