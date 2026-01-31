"use client";

import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import GlassCard from "@/components/GlassCard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CorrelationChartProps {
    userSettings: UserSettings;
    from: Date;
    to: Date;
    tagIds?: string[];
    isPrivacyMode?: boolean;
}

export default function CorrelationChart({ userSettings, from, to, tagIds = [], isPrivacyMode = false }: CorrelationChartProps) {
    const [cat1, setCat1] = useState<string>("");
    const [cat2, setCat2] = useState<string>("");

    const formatter = useMemo(() => {
        return GetFormatterForCurrency(userSettings.currency);
    }, [userSettings.currency]);

    // Fetch all categories for the dropdowns
    const categoriesQuery = useQuery({
        queryKey: ["categories", "all"],
        queryFn: () => fetch("/api/categories").then((res) => res.json()),
    });

    const tagQueryParam = tagIds.length > 0 ? `&tags=${tagIds.join(",")}` : "";

    // Set default categories once data is loaded
    useMemo(() => {
        if (categoriesQuery.data && categoriesQuery.data.length >= 2) {
            if (!cat1) setCat1(categoriesQuery.data[0].name);
            if (!cat2) setCat2(categoriesQuery.data[1].name);
        }
    }, [categoriesQuery.data, cat1, cat2]);

    const correlationQuery = useQuery({
        queryKey: ["analytics", "correlation", cat1, cat2, from, to, tagIds],
        queryFn: () =>
            fetch(
                `/api/analytics/correlation?from=${from.toISOString()}&to=${to.toISOString()}&cat1=${cat1}&cat2=${cat2}${tagQueryParam}`
            ).then((res) => res.json()),
        enabled: !!cat1 && !!cat2,
    });

    const dataAvailable = correlationQuery.data && correlationQuery.data.length > 0;

    return (
        <GlassCard className="col-span-12">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10" />

            <CardHeader className="relative">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 3xl:text-2xl">
                            <span className="text-2xl">📉</span>
                            Correlation Analytics
                        </CardTitle>
                        <CardDescription>
                            Compare two categories to find spending patterns and behaviors
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Compare</span>
                            <Select value={cat1} onValueChange={setCat1}>
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue placeholder="Category 1" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoriesQuery.data?.map((cat: any) => (
                                        <SelectItem key={`cat1-${cat.name}`} value={cat.name}>
                                            {cat.icon} {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">with</span>
                            <Select value={cat2} onValueChange={setCat2}>
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue placeholder="Category 2" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoriesQuery.data?.map((cat: any) => (
                                        <SelectItem key={`cat2-${cat.name}`} value={cat.name}>
                                            {cat.icon} {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative">
                <SkeletonWrapper isLoading={correlationQuery.isFetching || categoriesQuery.isFetching}>
                    {dataAvailable ? (
                        <ResponsiveContainer width="100%" height={400} className={cn(isPrivacyMode && "privacy-blur")}>
                            <LineChart data={correlationQuery.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) => format(parseISO(date), "MMM dd")}
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
                                                    {format(parseISO(data.date), "MMM dd, yyyy")}
                                                </p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                                                        <span className="text-sm text-muted-foreground">{cat1}:</span>
                                                        <span className="font-semibold text-blue-500">
                                                            {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.amount1)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-3 w-3 rounded-full bg-purple-500" />
                                                        <span className="text-sm text-muted-foreground">{cat2}:</span>
                                                        <span className="font-semibold text-purple-500">
                                                            {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.amount2)}
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
                                    dataKey="amount1"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                    name={cat1}
                                    activeDot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount2"
                                    stroke="#a855f7"
                                    strokeWidth={2}
                                    dot={false}
                                    name={cat2}
                                    activeDot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[400px] items-center justify-center flex-col gap-2">
                            <p className="text-muted-foreground">
                                No overlapping data found for these categories in the selected period
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Try selecting categories with more frequent transactions
                            </p>
                        </div>
                    )}
                </SkeletonWrapper>
            </CardContent>
        </GlassCard>
    );
}
