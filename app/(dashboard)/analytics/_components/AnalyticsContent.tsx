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
import SavingsImpactChart from "./SavingsImpactChart";
import KPICards from "./KPICards";
import CorrelationChart from "./CorrelationChart";
import { UserSettings } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { exportAnalyticsToPDF } from "@/lib/pdf-export";
import { useQuery } from "@tanstack/react-query";
import TagFilter from "./TagFilter";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface AnalyticsContentProps {
  userSettings: UserSettings;
}

export default function AnalyticsContent({ userSettings }: AnalyticsContentProps) {
  const [dataRange, setDataRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Get tag IDs for API calls
  const tagIds = selectedTags.map(tag => tag.id);
  const tagQueryParam = tagIds.length > 0 ? `&tags=${tagIds.join(',')}` : '';

  // Fetch category breakdown data for expense
  const categoryDataQuery = useQuery({
    queryKey: ["analytics", "category-breakdown", "expense", dataRange.from, dataRange.to, tagIds],
    queryFn: () =>
      fetch(
        `/api/analytics/category-breakdown?from=${dataRange.from.toISOString()}&to=${dataRange.to.toISOString()}&type=expense${tagQueryParam}`
      ).then((res) => res.json()),
  });

  // Fetch trends data
  const trendsDataQuery = useQuery({
    queryKey: ["analytics", "trends", dataRange.from, dataRange.to, tagIds],
    queryFn: () =>
      fetch(
        `/api/analytics/trends?from=${dataRange.from.toISOString()}&to=${dataRange.to.toISOString()}${tagQueryParam}`
      ).then((res) => res.json()),
  });

  const handleExportPDF = () => {
    if (!categoryDataQuery.data || !trendsDataQuery.data) {
      toast.error("Please wait for data to load before exporting");
      return;
    }

    exportAnalyticsToPDF(categoryDataQuery.data, trendsDataQuery.data, {
      title: "Analytics Report",
      dateRange: dataRange,
      currency: userSettings.currency,
    });

    toast.success("Analytics report exported successfully!");
  };


  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-4">
          <div>
            <p className="text-3xl font-bold">Analytics & Insights</p>
            <p className="text-muted-foreground">
              Visualize your financial data with comprehensive charts and insights
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <TagFilter
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
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
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={categoryDataQuery.isFetching || trendsDataQuery.isFetching}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="mb-6">
          <KPICards
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Pie Charts - Category Breakdown */}
          <CategoryBreakdownChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            type="expense"
            tagIds={tagIds}
          />
          <CategoryBreakdownChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            type="income"
            tagIds={tagIds}
          />

          {/* Line Chart - Trends */}
          <TrendsChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            tagIds={tagIds}
          />

          {/* Correlation Analytics */}
          <CorrelationChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            tagIds={tagIds}
          />

          {/* Heatmap */}
          <HeatmapChart
            from={dataRange.from}
            to={dataRange.to}
            userSettings={userSettings}
            tagIds={tagIds}
          />

          {/* Year-over-Year Comparison */}
          <ComparisonChart
            userSettings={userSettings}
            tagIds={tagIds}
          />

          {/* Savings Goals Impact */}
          <SavingsImpactChart userSettings={userSettings} />
        </div>
      </div>
    </>
  );
}
