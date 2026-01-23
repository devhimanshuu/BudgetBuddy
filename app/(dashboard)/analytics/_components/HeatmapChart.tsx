"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { UserSettings } from "@prisma/client";
import { GetFormatterForCurrency } from "@/lib/helper";

interface HeatmapChartProps {
  from: Date;
  to: Date;
  userSettings: UserSettings;
  tagIds?: string[];
}

export default function HeatmapChart({ from, to, userSettings, tagIds = [] }: HeatmapChartProps) {
  const tagQueryParam = tagIds.length > 0 ? `&tags=${tagIds.join(',')}` : '';

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const heatmapQuery = useQuery({
    queryKey: ["analytics", "heatmap", from, to, tagIds],
    queryFn: () =>
      fetch(
        `/api/analytics/heatmap?from=${from.toISOString()}&to=${to.toISOString()}${tagQueryParam}`
      ).then((res) => res.json()),
  });

  const maxValue = useMemo(() => {
    if (!heatmapQuery.data) return 0;
    let max = 0;
    heatmapQuery.data.forEach((day: any) => {
      for (let hour = 0; hour < 24; hour++) {
        const value = day[`h${hour}`] || 0;
        if (value > max) max = value;
      }
    });
    return max;
  }, [heatmapQuery.data]);

  const getColor = (value: number) => {
    if (value === 0) return "bg-gray-100 dark:bg-gray-800";
    const intensity = Math.min(value / maxValue, 1);
    if (intensity < 0.2) return "bg-red-200 dark:bg-red-900/30";
    if (intensity < 0.4) return "bg-red-300 dark:bg-red-800/50";
    if (intensity < 0.6) return "bg-red-400 dark:bg-red-700/70";
    if (intensity < 0.8) return "bg-red-500 dark:bg-red-600/80";
    return "bg-red-600 dark:bg-red-500";
  };

  const dataAvailable = heatmapQuery.data && heatmapQuery.data.length > 0;

  // Group hours into time blocks for better visualization
  const timeBlocks = [
    { label: "Night", hours: [0, 1, 2, 3, 4, 5] },
    { label: "Morning", hours: [6, 7, 8, 9, 10, 11] },
    { label: "Afternoon", hours: [12, 13, 14, 15, 16, 17] },
    { label: "Evening", hours: [18, 19, 20, 21, 22, 23] },
  ];

  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          Spending Heatmap - Activity by Day & Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SkeletonWrapper isLoading={heatmapQuery.isFetching}>
          {dataAvailable ? (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Time block headers */}
                <div className="mb-2 flex">
                  <div className="w-16" />
                  {timeBlocks.map((block) => (
                    <div
                      key={block.label}
                      className="flex-1 text-center text-sm font-medium text-muted-foreground"
                    >
                      {block.label}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div className="space-y-1">
                  {heatmapQuery.data.map((dayData: any) => (
                    <div key={dayData.day} className="flex items-center gap-1">
                      <div className="w-16 text-sm font-medium">
                        {dayData.day}
                      </div>
                      {timeBlocks.map((block) => {
                        const blockTotal = block.hours.reduce(
                          (sum, hour) => sum + (dayData[`h${hour}`] || 0),
                          0
                        );
                        return (
                          <div
                            key={block.label}
                            className={`group relative flex-1 cursor-pointer rounded p-4 transition-all hover:scale-105 hover:shadow-lg ${getColor(
                              blockTotal
                            )}`}
                            title={`${dayData.day} ${block.label}: ${formatter.format(blockTotal)}`}
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="text-xs font-semibold">
                                {formatter.format(blockTotal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Less</span>
                  <div className="flex gap-1">
                    <div className="h-4 w-4 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-4 w-4 rounded bg-red-200 dark:bg-red-900/30" />
                    <div className="h-4 w-4 rounded bg-red-300 dark:bg-red-800/50" />
                    <div className="h-4 w-4 rounded bg-red-400 dark:bg-red-700/70" />
                    <div className="h-4 w-4 rounded bg-red-500 dark:bg-red-600/80" />
                    <div className="h-4 w-4 rounded bg-red-600 dark:bg-red-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">More</span>
                </div>
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
