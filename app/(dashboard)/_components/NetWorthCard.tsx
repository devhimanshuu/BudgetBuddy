"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { cn } from "@/lib/utils";

interface NetWorthCardProps {
  userSettings: UserSettings;
}

export default function NetWorthCard({ userSettings }: NetWorthCardProps) {
  const statsQuery = useQuery({
    queryKey: ["overview", "stats"],
    queryFn: () => fetch("/api/stats").then((res) => res.json()),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const income = statsQuery.data?.income || 0;
  const expense = statsQuery.data?.expense || 0;
  const balance = income - expense;
  const previousBalance = statsQuery.data?.previousBalance || 0;
  const balanceChange = balance - previousBalance;
  const balanceChangePercent =
    previousBalance !== 0 ? (balanceChange / previousBalance) * 100 : 0;

  return (
    <SkeletonWrapper isLoading={statsQuery.isFetching}>
      <Card className="relative overflow-hidden h-full">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />

        <CardHeader className="relative 3xl:p-8">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 3xl:gap-3">
              <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2 3xl:p-3">
                <Wallet className="h-5 w-5 text-white 3xl:h-6 3xl:w-6" />
              </div>
              <span className="3xl:text-xl">Net Worth</span>
            </div>
            {balanceChange !== 0 && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm 3xl:text-base",
                  balanceChange > 0 ? "text-emerald-500" : "text-red-500"
                )}
              >
                {balanceChange > 0 ? (
                  <TrendingUp className="h-4 w-4 3xl:h-5 3xl:w-5" />
                ) : (
                  <TrendingDown className="h-4 w-4 3xl:h-5 3xl:w-5" />
                )}
                <span>
                  {Math.abs(balanceChangePercent).toFixed(1)}%
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-4 3xl:space-y-6 3xl:p-8 3xl:pt-0">
          {/* Main Balance */}
          <div>
            <p className="text-sm text-muted-foreground 3xl:text-base">Total Balance</p>
            <p
              className={cn(
                "text-4xl font-bold 3xl:text-5xl",
                balance >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {formatter.format(balance)}
            </p>
            {balanceChange !== 0 && (
              <p className="text-sm text-muted-foreground 3xl:text-base">
                {balanceChange > 0 ? "+" : ""}
                {formatter.format(balanceChange)} from last month
              </p>
            )}
          </div>

          {/* Income & Expense Breakdown */}
          <div className="grid grid-cols-2 gap-4 3xl:gap-6">
            <div className="space-y-1 3xl:space-y-2">
              <p className="text-xs text-muted-foreground 3xl:text-sm">Income</p>
              <p className="text-lg font-semibold text-emerald-600 3xl:text-xl">
                {formatter.format(income)}
              </p>
            </div>
            <div className="space-y-1 3xl:space-y-2">
              <p className="text-xs text-muted-foreground 3xl:text-sm">Expenses</p>
              <p className="text-lg font-semibold text-red-600 3xl:text-xl">
                {formatter.format(expense)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
