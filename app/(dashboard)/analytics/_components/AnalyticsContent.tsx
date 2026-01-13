"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { differenceInDays, startOfMonth } from "date-fns";
import React, { useState } from "react";
import { toast } from "sonner";
import CategoryBreakdownChart from "./CategoryBreakdownChart";
import TrendsChart from "./TrendsChart";
import HeatmapChart from "./HeatmapChart";
import ComparisonChart from "./ComparisonChart";
import { UserSettings } from "@prisma/client";

interface AnalyticsContentProps {
  userSettings: UserSettings;
}

export default function AnalyticsContent({ userSettings }: AnalyticsContentProps) {
  const [dataRange, setDataRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          <div>
            <p className="text-3xl font-bold">Analytics & Insights</p>
            <p className="text-muted-foreground">
              Visualize your financial data with comprehensive charts and insights
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DateRangePicker
              initialDateFrom={dataRange.from}
              initialDateTo={dataRange.to}
              showCompare={false}
              onUpdate={(values) => {
                const { from, to } = values.range;

                if (!from || !to) return;
                if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
                  toast.error(
                    `The selected date range is too big. Max allowed range is ${MAX_DATE_RANGE_DAYS} days`
                  );
                  return;
                }
                setDataRange({ from, to });
              }}
            />
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Pie Charts - Category Breakdown */}
          <CategoryBreakdownChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            type="expense"
          />
          <CategoryBreakdownChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            type="income"
          />

          {/* Line Chart - Trends */}
          <TrendsChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
          />

          {/* Heatmap */}
          <HeatmapChart from={dataRange.from} to={dataRange.to} />

          {/* Year-over-Year Comparison */}
          <ComparisonChart userSettings={userSettings} />
        </div>
      </div>
    </>
  );
}
