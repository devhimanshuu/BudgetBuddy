"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface CategoryBreakdownProps {
  userSettings: UserSettings;
  from: Date;
  to: Date;
  type: "income" | "expense";
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
}: CategoryBreakdownProps) {
  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const categoryBreakdownQuery = useQuery({
    queryKey: ["analytics", "category-breakdown", type, from, to],
    queryFn: () =>
      fetch(
        `/api/analytics/category-breakdown?from=${from.toISOString()}&to=${to.toISOString()}&type=${type}`
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
    <Card className="col-span-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">
            {type === "expense" ? "💸" : "💰"}
          </span>
          {type === "expense" ? "Expense" : "Income"} Breakdown by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SkeletonWrapper isLoading={categoryBreakdownQuery.isFetching}>
          {dataAvailable ? (
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={300}>
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
                  >
                    {categoryBreakdownQuery.data.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
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
                              {formatter.format(data.amount)}
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
                    className="flex items-center gap-2 rounded-lg border p-2"
                  >
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium">
                        {item.categoryIcon} {item.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatter.format(item.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
    </Card>
  );
}
