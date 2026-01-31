"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlassCard from "@/components/GlassCard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import CategoryDrilldownSheet from "./CategoryDrilldownSheet";

interface CategoryBreakdownProps {
  userSettings: UserSettings;
  from: Date;
  to: Date;
  type: "income" | "expense";
  tagIds?: string[];
  isPrivacyMode?: boolean;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B9D",
  "#C084FC",
  "#34D399",
];

export default function CategoryBreakdownChart({
  userSettings,
  from,
  to,
  type,
  tagIds = [],
  isPrivacyMode = false,
}: CategoryBreakdownProps) {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const tagQueryParam = tagIds.length > 0 ? `&tags=${tagIds.join(',')}` : '';

  const categoryBreakdownQuery = useQuery({
    queryKey: ["analytics", "category-breakdown", type, from, to, tagIds],
    queryFn: () =>
      fetch(
        `/api/analytics/category-breakdown?from=${from.toISOString()}&to=${to.toISOString()}&type=${type}${tagQueryParam}`
      ).then((res) => res.json()),
  });

  const dataAvailable =
    categoryBreakdownQuery.data && categoryBreakdownQuery.data.length > 0;

  const total = useMemo(() => {
    if (!categoryBreakdownQuery.data) return 0;
    return categoryBreakdownQuery.data.reduce(
      (sum: number, item: any) => sum + item.amount,
      0
    );
  }, [categoryBreakdownQuery.data]);

  return (
    <GlassCard className="col-span-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 3xl:text-2xl">
          <span className="text-2xl">
            {type === "expense" ? "💸" : "💰"}
          </span>
          {type === "expense" ? "Expense" : "Income"} Breakdown by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <SkeletonWrapper isLoading={categoryBreakdownQuery.isFetching}>
          {dataAvailable ? (
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={300} className={cn(isPrivacyMode && "privacy-blur")}>
                <PieChart>
                  <Pie
                    data={categoryBreakdownQuery.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) =>
                      `${category} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    onClick={(data) => {
                      setSelectedCategory(data.payload);
                      setIsSheetOpen(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {categoryBreakdownQuery.data.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity outline-none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded border bg-background p-4 shadow-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{data.categoryIcon}</span>
                            <span className="font-semibold">{data.category}</span>
                          </div>
                          <div className="mt-2 text-sm">
                            <p className="text-muted-foreground">Amount:</p>
                            <p className="text-lg font-bold">
                              {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.amount)}
                            </p>
                            <p className="text-muted-foreground">
                              {((data.amount / total) * 100).toFixed(1)}% of total
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {categoryBreakdownQuery.data.map((item: any, index: number) => (
                  <div
                    key={item.category}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors hover:bg-muted"
                    onClick={() => {
                      setSelectedCategory(item);
                      setIsSheetOpen(true);
                    }}
                  >
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium">
                        {item.categoryIcon} {item.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(item.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <CategoryDrilldownSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                category={selectedCategory}
                type={type}
                from={from}
                to={to}
                tagIds={tagIds}
                userSettings={userSettings}
              />
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-muted-foreground">
                No data available for the selected period
              </p>
            </div>
          )}
        </SkeletonWrapper>
      </CardContent>
    </GlassCard>
  );
}
