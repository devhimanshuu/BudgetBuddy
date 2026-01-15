"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BudgetOverviewProps {
  userSettings: UserSettings;
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

export default function BudgetOverview({ userSettings }: BudgetOverviewProps) {
  const currentDate = new Date();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

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

  // Get budgets that need attention (over budget or near limit)
  const alertBudgets = budgetProgress?.filter(
    (b) => b.isOverBudget || b.isNearLimit
  );

  if (!dataAvailable) {
    return null; // Don't show widget if no budgets
  }

  return (
    <Card className="col-span-12">
       <CardHeader className="3xl:p-8">
         <div className="flex items-center justify-between">
           <CardTitle className="flex items-center gap-2 3xl:text-2xl 3xl:gap-3">
             <TrendingUp className="h-5 w-5 3xl:h-6 3xl:w-6" />
             Budget Overview
           </CardTitle>
           <Link href="/budgets">
             <Button variant="ghost" size="sm" className="3xl:text-base">
               View All
             </Button>
           </Link>
         </div>
       </CardHeader>
       <CardContent className="3xl:p-8 3xl:pt-0">
         <SkeletonWrapper isLoading={isFetching}>
           <div className="space-y-4 3xl:space-y-6">
             {alertBudgets && alertBudgets.length > 0 && (
               <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950/20 3xl:p-4">
                 <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 3xl:text-base">
                   <AlertTriangle className="h-4 w-4 3xl:h-5 3xl:w-5" />
                   {alertBudgets.length} budget{alertBudgets.length > 1 ? "s" : ""}{" "}
                   need attention
                 </div>
               </div>
             )}

             <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 3xl:gap-4">
               {budgetProgress?.slice(0, 6).map((budget) => (
                 <div
                   key={budget.id}
                   className={cn(
                     "rounded-lg border p-3 3xl:p-4",
                     budget.isOverBudget &&
                       "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20",
                     budget.isNearLimit &&
                       !budget.isOverBudget &&
                       "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20"
                   )}
                 >
                   <div className="flex items-center justify-between mb-2 3xl:mb-3">
                     <span className="text-sm font-medium flex items-center gap-1 3xl:text-base 3xl:gap-2">
                       <span className="text-xl 3xl:text-2xl">{budget.categoryIcon}</span>
                       <span>{budget.category}</span>
                     </span>
                     {budget.isOverBudget && (
                       <AlertTriangle className="h-4 w-4 text-red-500 3xl:h-5 3xl:w-5" />
                     )}
                   </div>
                   <Progress
                     value={budget.percentage}
                     className={cn(
                       "h-1.5 mb-2 3xl:h-2.5 3xl:mb-3",
                       budget.isOverBudget && "[&>div]:bg-red-500",
                       budget.isNearLimit &&
                         !budget.isOverBudget &&
                         "[&>div]:bg-yellow-500"
                     )}
                   />
                   <div className="flex justify-between text-xs text-muted-foreground 3xl:text-sm">
                     <span>
                       {formatter.format(budget.spent)} /{" "}
                       {formatter.format(budget.budgetAmount)}
                     </span>
                     <span>{budget.percentage.toFixed(0)}%</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </SkeletonWrapper>
       </CardContent>
    </Card>
  );
}
