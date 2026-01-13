"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface TrendsChartProps {
  userSettings: UserSettings;
  from: Date;
  to: Date;
}

export default function TrendsChart({ userSettings, from, to }: TrendsChartProps) {
  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const trendsQuery = useQuery({
    queryKey: ["analytics", "trends", from, to],
    queryFn: () =>
      fetch(
        `/api/analytics/trends?from=${from.toISOString()}&to=${to.toISOString()}`
      ).then((res) => res.json()),
  });

  const dataAvailable = trendsQuery.data && trendsQuery.data.length > 0;

  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📈</span>
          Income vs Expense Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SkeletonWrapper isLoading={trendsQuery.isFetching}>
          {dataAvailable ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendsQuery.data}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MMM dd")}
                  stroke="#888888"
                  fontSize={12}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickFormatter={(value) => formatter.format(value)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded border bg-background p-4 shadow-lg">
                        <p className="mb-2 font-semibold">
                          {format(new Date(data.date), "MMM dd, yyyy")}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-sm text-muted-foreground">
                              Income:
                            </span>
                            <span className="font-semibold text-emerald-500">
                              {formatter.format(data.income)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <span className="text-sm text-muted-foreground">
                              Expense:
                            </span>
                            <span className="font-semibold text-red-500">
                              {formatter.format(data.expense)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-t pt-1">
                            <div className="h-3 w-3 rounded-full bg-blue-500" />
                            <span className="text-sm text-muted-foreground">
                              Balance:
                            </span>
                            <span
                              className={`font-semibold ${
                                data.balance >= 0 ? "text-emerald-500" : "text-red-500"
                              }`}
                            >
                              {formatter.format(data.balance)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Expense"
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[400px] items-center justify-center">
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
