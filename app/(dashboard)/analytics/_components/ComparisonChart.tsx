"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlassCard from "@/components/GlassCard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
interface ComparisonChartProps {
  userSettings: UserSettings;
  tagIds?: string[];
  isPrivacyMode?: boolean;
}

export default function ComparisonChart({ userSettings, tagIds = [], isPrivacyMode = false }: ComparisonChartProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const tagQueryParam = tagIds.length > 0 ? `&tags=${tagIds.join(',')}` : '';

  const comparisonQuery = useQuery({
    queryKey: ["analytics", "comparison", selectedYear, tagIds],
    queryFn: () =>
      fetch(`/api/analytics/comparison?year=${selectedYear}${tagQueryParam}`).then((res) =>
        res.json()
      ),
  });

  const dataAvailable = comparisonQuery.data && comparisonQuery.data.length > 0;

  return (
    <GlassCard className="col-span-12">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10" />

      <CardHeader className="relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 3xl:text-2xl">
            <span className="text-2xl">📊</span>
            Year-over-Year Comparison
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(selectedYear - 1)}
            >
              ← Previous Year
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(currentYear)}
              disabled={selectedYear === currentYear}
            >
              Current Year
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(selectedYear + 1)}
              disabled={selectedYear >= currentYear}
            >
              Next Year →
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Comparing {selectedYear} vs {selectedYear - 1}
        </p>
      </CardHeader>
      <CardContent className="relative">
        <SkeletonWrapper isLoading={comparisonQuery.isFetching}>
          {dataAvailable ? (
            <div className="space-y-4">
              {/* Expense Comparison */}
              <div>
                <h3 className="mb-2 text-lg font-semibold">Expense Comparison</h3>
                <ResponsiveContainer width="100%" height={300} className={cn(isPrivacyMode && "privacy-blur")}>
                  <BarChart data={comparisonQuery.data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickFormatter={(value) => formatter.format(value)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0)
                          return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded border bg-background p-4 shadow-lg">
                            <p className="mb-2 font-semibold">{data.month}</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-500" />
                                <span className="text-sm text-muted-foreground">
                                  {selectedYear}:
                                </span>
                                <span className="font-semibold">
                                  {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.currentYearExpense)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-300" />
                                <span className="text-sm text-muted-foreground">
                                  {selectedYear - 1}:
                                </span>
                                <span className="font-semibold">
                                  {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.previousYearExpense)}
                                </span>
                              </div>
                              <div className="border-t pt-1">
                                <span className="text-sm text-muted-foreground">
                                  Change:{" "}
                                </span>
                                <span
                                  className={`font-semibold ${data.currentYearExpense >
                                    data.previousYearExpense
                                    ? "text-red-500"
                                    : "text-emerald-500"
                                    }`}
                                >
                                  {data.previousYearExpense > 0
                                    ? (
                                      ((data.currentYearExpense -
                                        data.previousYearExpense) /
                                        data.previousYearExpense) *
                                      100
                                    ).toFixed(1)
                                    : "N/A"}
                                  %
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="currentYearExpense"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      name={`${selectedYear} Expense`}
                    />
                    <Bar
                      dataKey="previousYearExpense"
                      fill="#fca5a5"
                      radius={[4, 4, 0, 0]}
                      name={`${selectedYear - 1} Expense`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Income Comparison */}
              <div>
                <h3 className="mb-2 text-lg font-semibold">Income Comparison</h3>
                <ResponsiveContainer width="100%" height={300} className={cn(isPrivacyMode && "privacy-blur")}>
                  <BarChart data={comparisonQuery.data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickFormatter={(value) => formatter.format(value)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0)
                          return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded border bg-background p-4 shadow-lg">
                            <p className="mb-2 font-semibold">{data.month}</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                <span className="text-sm text-muted-foreground">
                                  {selectedYear}:
                                </span>
                                <span className="font-semibold">
                                  {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.currentYearIncome)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-300" />
                                <span className="text-sm text-muted-foreground">
                                  {selectedYear - 1}:
                                </span>
                                <span className="font-semibold">
                                  {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.previousYearIncome)}
                                </span>
                              </div>
                              <div className="border-t pt-1">
                                <span className="text-sm text-muted-foreground">
                                  Change:{" "}
                                </span>
                                <span
                                  className={`font-semibold ${data.currentYearIncome >
                                    data.previousYearIncome
                                    ? "text-emerald-500"
                                    : "text-red-500"
                                    }`}
                                >
                                  {data.previousYearIncome > 0
                                    ? (
                                      ((data.currentYearIncome -
                                        data.previousYearIncome) /
                                        data.previousYearIncome) *
                                      100
                                    ).toFixed(1)
                                    : "N/A"}
                                  %
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="currentYearIncome"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name={`${selectedYear} Income`}
                    />
                    <Bar
                      dataKey="previousYearIncome"
                      fill="#6ee7b7"
                      radius={[4, 4, 0, 0]}
                      name={`${selectedYear - 1} Income`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-muted-foreground">
                No data available for comparison
              </p>
            </div>
          )}
        </SkeletonWrapper>
      </CardContent>
    </GlassCard>
  );
}
