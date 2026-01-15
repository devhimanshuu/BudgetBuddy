"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AlertTriangle, TrendingDown, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import EditBudgetDialog from "./EditBudgetDialog";
import DeleteBudgetDialog from "./DeleteBudgetDialog";
import { Button } from "@/components/ui/button";

interface BudgetProgressProps {
  userSettings: UserSettings;
  month: number;
  year: number;
}

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

export default function BudgetProgressCards({
  userSettings,
  month,
  year,
}: BudgetProgressProps) {
  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const { data: budgetProgress, isFetching } = useQuery<BudgetProgress[]>({
    queryKey: ["budget-progress", month, year],
    queryFn: () =>
      fetch(`/api/budgets/progress?month=${month}&year=${year}`).then((res) =>
        res.json()
      ),
  });

  const dataAvailable = budgetProgress && budgetProgress.length > 0;

  return (
    <div className="space-y-4">
      <SkeletonWrapper isLoading={isFetching}>
        {dataAvailable ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgetProgress.map((budget) => (
              <Card
                key={budget.id}
                className={cn(
                  "relative overflow-hidden transition-all",
                  budget.isOverBudget &&
                    "border-red-500 bg-red-50 dark:bg-red-950/20",
                  budget.isNearLimit &&
                    !budget.isOverBudget &&
                    "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">{budget.categoryIcon}</span>
                      <span>{budget.category}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {budget.isOverBudget && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      {budget.isNearLimit && !budget.isOverBudget && (
                        <TrendingDown className="h-5 w-5 text-yellow-500" />
                      )}
                      <EditBudgetDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                        budget={{
                          id: budget.id,
                          category: budget.category,
                          categoryIcon: budget.categoryIcon,
                          budgetAmount: budget.budgetAmount,
                        }}
                        month={month}
                        year={year}
                      />
                      <DeleteBudgetDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        budget={{
                          id: budget.id,
                          category: budget.category,
                          categoryIcon: budget.categoryIcon,
                        }}
                        month={month}
                        year={year}
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span
                        className={cn(
                          "font-semibold",
                          budget.isOverBudget && "text-red-600 dark:text-red-400"
                        )}
                      >
                        {formatter.format(budget.spent)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-medium">
                        {formatter.format(budget.budgetAmount)}
                      </span>
                    </div>
                  </div>

                  <Progress
                    value={budget.percentage}
                    className={cn(
                      "h-2",
                      budget.isOverBudget && "[&>div]:bg-red-500",
                      budget.isNearLimit &&
                        !budget.isOverBudget &&
                        "[&>div]:bg-yellow-500"
                    )}
                  />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {budget.isOverBudget ? "Over budget" : "Remaining"}
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        budget.isOverBudget
                          ? "text-red-600 dark:text-red-400"
                          : budget.remaining < budget.budgetAmount * 0.2
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {formatter.format(Math.abs(budget.remaining))}
                    </span>
                  </div>

                  <div className="text-center text-xs text-muted-foreground">
                    {budget.percentage.toFixed(0)}% of budget used
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">
                No budgets set for this month. Create one to start tracking!
              </p>
            </CardContent>
          </Card>
        )}
      </SkeletonWrapper>
    </div>
  );
}
