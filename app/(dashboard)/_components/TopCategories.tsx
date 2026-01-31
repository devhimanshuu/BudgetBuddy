"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { PieChart } from "lucide-react";
import { useMemo } from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";
import { cn } from "@/lib/utils";

interface TopCategoriesProps {
  userSettings: UserSettings;
}

interface CategoryData {
  category: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

export default function TopCategories({ userSettings }: TopCategoriesProps) {
  const { isPrivacyMode } = usePrivacyMode();
  const categoriesQuery = useQuery<CategoryData[]>({
    queryKey: ["top-categories"],
    queryFn: () => fetch("/api/stats/top-categories").then((res) => res.json()),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const topCategories = categoriesQuery.data?.slice(0, 3) || [];
  const totalAmount =
    categoriesQuery.data?.reduce((sum, cat) => sum + cat.amount, 0) || 0;

  return (
    <SkeletonWrapper isLoading={categoriesQuery.isFetching}>
      <Card className="h-full">
        <CardHeader className="3xl:p-8">
          <CardTitle className="flex items-center gap-2 3xl:text-2xl 3xl:gap-3">
            <PieChart className="h-5 w-5 text-purple-500 3xl:h-6 3xl:w-6" />
            Top Spending Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="3xl:p-8 3xl:pt-0">
          {topCategories.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground 3xl:text-base">
              No spending data available
            </div>
          ) : (
            <div className="space-y-4 3xl:space-y-6">
              {topCategories.map((category, index) => (
                <div key={category.category} className="space-y-2 3xl:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 3xl:gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted 3xl:h-10 3xl:w-10">
                        <span className="text-lg 3xl:text-xl">{category.categoryIcon}</span>
                      </div>
                      <div>
                        <p className="font-medium 3xl:text-lg">{category.category}</p>
                        <p className="text-xs text-muted-foreground 3xl:text-sm">
                          #{index + 1} category
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-semibold 3xl:text-lg", isPrivacyMode && "privacy-blur")}>
                        {isPrivacyMode ? "$******" : formatter.format(category.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground 3xl:text-sm">
                        {category.percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={category.percentage}
                    className="h-2 3xl:h-3"
                    style={
                      {
                        "--progress-color":
                          index === 0
                            ? "hsl(var(--chart-1))"
                            : index === 1
                              ? "hsl(var(--chart-2))"
                              : "hsl(var(--chart-3))",
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}

              {/* Total */}
              <div className="mt-4 rounded-lg bg-muted p-3 3xl:mt-6 3xl:p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium 3xl:text-base">Total Spending</p>
                  <p className={cn("text-lg font-bold 3xl:text-xl", isPrivacyMode && "privacy-blur")}>
                    {isPrivacyMode ? "$******" : formatter.format(totalAmount)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground 3xl:text-sm">
                  Top 3 categories represent{" "}
                  {topCategories
                    .reduce((sum, cat) => sum + cat.percentage, 0)
                    .toFixed(1)}
                  % of total
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
