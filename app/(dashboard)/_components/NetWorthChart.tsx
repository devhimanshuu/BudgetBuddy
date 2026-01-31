"use client";

import GlassCard from "@/components/GlassCard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";

interface NetWorthChartProps {
    userSettings: UserSettings;
}

export default function NetWorthChart({ userSettings }: NetWorthChartProps) {
    const { isPrivacyMode } = usePrivacyMode();
    const [period, setPeriod] = useState<"month" | "year" | "all">("year");

    const netWorthQuery = useQuery({
        queryKey: ["net-worth", period],
        queryFn: () =>
            fetch(`/api/net-worth?period=${period}`).then((res) => res.json()),
    });

    const formatter = useMemo(() => {
        return GetFormatterForCurrency(userSettings.currency);
    }, [userSettings.currency]);

    const data = netWorthQuery.data?.history || [];
    const current = netWorthQuery.data?.current || {
        assets: 0,
        liabilities: 0,
        cash: 0,
        netWorth: 0,
    };

    return (
        <SkeletonWrapper isLoading={netWorthQuery.isFetching}>
            <GlassCard className="h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10" />

                <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl 3xl:text-2xl">
                            Net Worth Over Time
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant={period === "month" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPeriod("month")}
                            >
                                1M
                            </Button>
                            <Button
                                variant={period === "year" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPeriod("year")}
                            >
                                1Y
                            </Button>
                            <Button
                                variant={period === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPeriod("all")}
                            >
                                All
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative space-y-6">
                    {/* Current Summary */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Net Worth</p>
                            <p
                                className={cn(
                                    "text-lg font-bold 3xl:text-xl",
                                    current.netWorth >= 0 ? "text-emerald-600" : "text-red-600"
                                )}
                            >
                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(current.netWorth)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Total Assets</p>
                            <p className="text-lg font-semibold text-blue-600 3xl:text-xl">
                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(current.assets)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Cash Balance</p>
                            <p className="text-lg font-semibold text-emerald-600 3xl:text-xl">
                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(current.cash)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Liabilities</p>
                            <p className="text-lg font-semibold text-red-600 3xl:text-xl">
                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(current.liabilities)}
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300} className={cn(isPrivacyMode && "privacy-blur")}>
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="netWorth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="assets" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="liabilities" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    className="text-xs"
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return date.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        });
                                    }}
                                />
                                <YAxis
                                    className="text-xs"
                                    tickFormatter={(value) => {
                                        return new Intl.NumberFormat("en-US", {
                                            notation: "compact",
                                            compactDisplay: "short",
                                        }).format(value);
                                    }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload || payload.length === 0)
                                            return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                                                <p className="mb-2 text-sm font-medium">
                                                    {new Date(data.date).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-emerald-600">Net Worth:</span>
                                                        <span className="font-semibold">
                                                            {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.netWorth)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-blue-600">Assets:</span>
                                                        <span className="font-semibold">
                                                            {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.assets)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-emerald-600">Cash:</span>
                                                        <span className="font-semibold">
                                                            {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.cash)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-red-600">Liabilities:</span>
                                                        <span className="font-semibold">
                                                            {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data.liabilities)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="netWorth"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#netWorth)"
                                    name="Net Worth"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="assets"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#assets)"
                                    name="Assets"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="liabilities"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fill="url(#liabilities)"
                                    name="Liabilities"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                            <p>No data available. Add assets or liabilities to see trends.</p>
                        </div>
                    )}
                </CardContent>
            </GlassCard>
        </SkeletonWrapper>
    );
}
