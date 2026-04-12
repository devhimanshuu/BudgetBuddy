"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSettings } from "@prisma/client";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";

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

interface BudgetChartProps {
  userSettings: UserSettings;
  budgetProgress: BudgetProgress[] | undefined;
}

export default function BudgetChart({
  userSettings,
  budgetProgress,
}: BudgetChartProps) {
  const { isPrivacyMode } = usePrivacyMode();
  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  if (!budgetProgress || budgetProgress.length === 0) {
    return null;
  }

  const chartData = budgetProgress.map((b) => ({
    name: b.category,
    Budget: b.budgetAmount,
    Spent: b.spent,
  }));

  const formatTooltipValue = (value: number) => {
    return isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(value);
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-xl">Budget vs. Actual</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${userSettings.currency} ${value}`}
            />
            <Tooltip
              formatter={formatTooltipValue}
              cursor={{ fill: "transparent" }}
            />
            <Legend />
            <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
