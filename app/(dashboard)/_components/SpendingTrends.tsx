"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp, Activity } from "lucide-react";
import { useMemo } from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";
import { cn } from "@/lib/utils";

interface SpendingTrendsProps {
  userSettings: UserSettings;
}

interface CategoryTrend {
  category: string;
  categoryIcon: string;
  currentMonth: number;
  previousMonth: number;
  change: number;
  changePercent: number;
}

export default function SpendingTrends({ userSettings }: SpendingTrendsProps) {
  const { isPrivacyMode } = usePrivacyMode();
  const trendsQuery = useQuery<CategoryTrend[]>({
    queryKey: ["spending-trends"],
    queryFn: () => fetch("/api/stats/trends").then((res) => res.json()),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const significantTrends =
    trendsQuery.data?.filter((t) => Math.abs(t.changePercent) >= 10) || [];

  return (
    <SkeletonWrapper isLoading={trendsQuery.isFetching}>
      <Card className="h-full">
        <CardHeader className="3xl:p-8">
          <CardTitle className="flex items-center gap-2 3xl:text-2xl 3xl:gap-3">
            <Activity className="h-5 w-5 text-blue-500 3xl:h-6 3xl:w-6" />
            Spending Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="3xl:p-8 3xl:pt-0">
          {significantTrends.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground 3xl:text-base">
              No significant spending changes this month
            </div>
          ) : (
            <div className="space-y-3 3xl:space-y-4">
              {significantTrends.slice(0, 5).map((trend) => (
                <div
                  key={trend.category}
                  className="flex items-center justify-between rounded-lg border p-3 3xl:p-4"
                >
                  <div className="flex items-center gap-3 3xl:gap-4">
                    <span className="text-2xl 3xl:text-3xl">{trend.categoryIcon}</span>
                    <div>
                      <p className="font-medium 3xl:text-lg">{trend.category}</p>
                      <p className="text-sm text-muted-foreground 3xl:text-base">
                        {trend.change > 0 ? "Spent " : "Saved "}
                        <span
                          className={cn(
                            "font-semibold",
                            trend.change > 0 ? "text-red-600" : "text-emerald-600",
                            isPrivacyMode && "privacy-blur"
                          )}
                        >
                          {isPrivacyMode ? "**%" : `${Math.abs(trend.changePercent).toFixed(0)}%`}{" "}
                          {trend.change > 0 ? "more" : "less"}
                        </span>
                        {" vs last month"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 3xl:gap-3">
                    {trend.change > 0 ? (
                      <TrendingUp className="h-5 w-5 text-red-500 3xl:h-6 3xl:w-6" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-emerald-500 3xl:h-6 3xl:w-6" />
                    )}
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-semibold 3xl:text-base",
                          trend.change > 0 ? "text-red-600" : "text-emerald-600",
                          isPrivacyMode && "privacy-blur"
                        )}
                      >
                        {trend.change > 0 ? "+" : ""}
                        {isPrivacyMode ? "$******" : formatter.format(Math.abs(trend.change))}
                      </p>
                      <p className={cn("text-xs text-muted-foreground 3xl:text-sm", isPrivacyMode && "privacy-blur")}>
                        {isPrivacyMode ? "$******" : formatter.format(trend.currentMonth)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
