"use client";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import CategoryBreakdownChart from "./CategoryBreakdownChart";
import TrendsChart from "./TrendsChart";
import HeatmapChart from "./HeatmapChart";
import ComparisonChart from "./ComparisonChart";
import SavingsImpactChart from "./SavingsImpactChart";
import KPICards from "./KPICards";
import CorrelationChart from "./CorrelationChart";
import CashFlowSankey from "./CashFlowSankey";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSettings } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { exportAnalyticsToPDF } from "@/lib/pdf-export";
import { useQuery } from "@tanstack/react-query";
import TagFilter from "./TagFilter";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface AnalyticsContentProps {
  userSettings: UserSettings;
}

export default function AnalyticsContent({ userSettings }: AnalyticsContentProps) {
  const { isPrivacyMode } = usePrivacyMode();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const dataRange = useMemo(() => {
    return {
      from: new Date(selectedYear, selectedMonth, 1),
      to: new Date(selectedYear, selectedMonth + 1, 0),
    };
  }, [selectedMonth, selectedYear]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 3 + i);

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
        <div className="container flex flex-wrap items-center justify-between gap-6 py-4 4xl:py-8">
          <div>
            <p className="text-3xl font-bold 4xl:text-5xl">Analytics & Insights</p>
            <p className="text-muted-foreground 4xl:text-lg">
              Visualize your financial data with comprehensive charts and insights
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap 4xl:gap-6">
            <TagFilter
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
            <div className="flex items-center gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-[140px] 4xl:w-[180px] 4xl:h-12 4xl:text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => {
                    const isFutureMonth = selectedYear === currentDate.getFullYear() && index > currentDate.getMonth();
                    return (
                      <SelectItem key={index} value={index.toString()} disabled={isFutureMonth}>
                        {month}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[100px] 4xl:w-[140px] 4xl:h-12 4xl:text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()} disabled={year > currentDate.getFullYear()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={categoryDataQuery.isFetching || trendsDataQuery.isFetching}
              className="4xl:text-lg 4xl:px-6 4xl:py-6"
            >
              <FileText className="mr-2 h-4 w-4 4xl:h-6 4xl:w-6" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6 4xl:py-10">
        <div className="mb-6 4xl:mb-10">
          <KPICards
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            isPrivacyMode={isPrivacyMode}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 2xl:gap-6 4xl:gap-8">
          {/* Pie Charts - Category Breakdown */}
          <CategoryBreakdownChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            type="expense"
            tagIds={tagIds}
            isPrivacyMode={isPrivacyMode}
          />
          <CategoryBreakdownChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            type="income"
            tagIds={tagIds}
            isPrivacyMode={isPrivacyMode}
          />

          {/* Line Chart - Trends */}
          <TrendsChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            tagIds={tagIds}
            isPrivacyMode={isPrivacyMode}
          />

          {/* Correlation Analytics */}
          <CorrelationChart
            userSettings={userSettings}
            from={dataRange.from}
            to={dataRange.to}
            tagIds={tagIds}
            isPrivacyMode={isPrivacyMode}
          />

          {/* Heatmap */}
          <HeatmapChart
            from={dataRange.from}
            to={dataRange.to}
            userSettings={userSettings}
            tagIds={tagIds}
            isPrivacyMode={isPrivacyMode}
          />
          <CashFlowSankey
            from={dataRange.from}
            to={dataRange.to}
            isPrivacyMode={isPrivacyMode}
          />
          {/* Year-over-Year Comparison */}
          <ComparisonChart
            userSettings={userSettings}
            tagIds={tagIds}
            isPrivacyMode={isPrivacyMode}
          />

          {/* Savings Goals Impact */}
          <SavingsImpactChart userSettings={userSettings} isPrivacyMode={isPrivacyMode} />
        </div>
      </div>
    </>
  );
}
