"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useMemo } from "react";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetProgress {
  id: string;
  category: string;
  categoryIcon: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

interface BudgetSummaryCardProps {
  userSettings: UserSettings;
  budgetProgress: BudgetProgress[] | undefined;
  isLoading: boolean;
}

export default function BudgetSummaryCard({
  userSettings,
  budgetProgress,
  isLoading,
}: BudgetSummaryCardProps) {
  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const summary = useMemo(() => {
    if (!budgetProgress || budgetProgress.length === 0) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallPercentage: 0,
        categoriesOverBudget: 0,
        categoriesNearLimit: 0,
        dailySafeToSpend: 0,
        daysRemaining: 0,
      };
    }

    const totalBudget = budgetProgress.reduce(
      (sum, b) => sum + b.budgetAmount,
      0
    );
    const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const categoriesOverBudget = budgetProgress.filter(
      (b) => b.isOverBudget
    ).length;
    const categoriesNearLimit = budgetProgress.filter(
      (b) => b.isNearLimit && !b.isOverBudget
    ).length;

    // Calculate days remaining in current month
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = Math.max(
      1,
      Math.ceil((lastDayOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Calculate daily safe-to-spend amount
    const dailySafeToSpend = totalRemaining > 0 ? totalRemaining / daysRemaining : 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage,
      categoriesOverBudget,
      categoriesNearLimit,
      dailySafeToSpend,
      daysRemaining,
    };
  }, [budgetProgress]);

  if (isLoading || !budgetProgress || budgetProgress.length === 0) {
    return null;
  }

  const isOverBudget = summary.totalSpent > summary.totalBudget;
  const isNearLimit = summary.overallPercentage >= 80 && !isOverBudget;

  return (
    <Card
      className={cn(
        "border-2 transition-all",
        isOverBudget && "border-red-500 bg-red-50 dark:bg-red-950/20",
        isNearLimit && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Wallet className="h-6 w-6" />
          Budget Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Budget */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold">
              {formatter.format(summary.totalBudget)}
            </p>
          </div>

          {/* Total Spent */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p
              className={cn(
                "text-2xl font-bold",
                isOverBudget && "text-red-600 dark:text-red-400"
              )}
            >
              {formatter.format(summary.totalSpent)}
            </p>
          </div>

          {/* Total Remaining */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isOverBudget ? "Over Budget" : "Remaining"}
            </p>
            <p
              className={cn(
                "text-2xl font-bold",
                isOverBudget
                  ? "text-red-600 dark:text-red-400"
                  : isNearLimit
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {formatter.format(Math.abs(summary.totalRemaining))}
            </p>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <div className="flex items-center gap-2">
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90 transform">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-muted/20"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.min(summary.overallPercentage, 100) / 100)
                      }`}
                    className={cn(
                      "transition-all duration-500",
                      isOverBudget
                        ? "text-red-500"
                        : isNearLimit
                          ? "text-yellow-500"
                          : "text-emerald-500"
                    )}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {Math.min(summary.overallPercentage, 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                {summary.categoriesOverBudget > 0 && (
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>{summary.categoriesOverBudget} over budget</span>
                  </div>
                )}
                {summary.categoriesNearLimit > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <TrendingDown className="h-3 w-3" />
                    <span>{summary.categoriesNearLimit} near limit</span>
                  </div>
                )}
                {summary.categoriesOverBudget === 0 &&
                  summary.categoriesNearLimit === 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      All on track! 🎉
                    </span>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Safe-to-Spend Section */}
        {!isOverBudget && summary.dailySafeToSpend > 0 && (
          <div className="mt-6 rounded-lg border-2 border-dashed border-emerald-500/50 bg-emerald-50 p-4 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  💡 Daily Safe-to-Spend
                </p>
                <p className="text-xs text-muted-foreground">
                  For the next {summary.daysRemaining} day{summary.daysRemaining !== 1 ? 's' : ''} of this month
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatter.format(summary.dailySafeToSpend)}
                </p>
                <p className="text-xs text-muted-foreground">per day</p>
              </div>
            </div>
          </div>
        )}

        {isOverBudget && (
          <div className="mt-6 rounded-lg border-2 border-dashed border-red-500/50 bg-red-50 p-4 dark:bg-red-950/20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  ⚠️ Budget Exceeded
                </p>
                <p className="text-xs text-muted-foreground">
                  You&apos;ve spent {formatter.format(Math.abs(summary.totalRemaining))} more than your budget
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
