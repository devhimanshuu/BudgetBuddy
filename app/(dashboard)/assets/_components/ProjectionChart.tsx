"use client";

import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
} from "recharts";
import { UserSettings } from "@prisma/client";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";

interface ProjectionChartProps {
    data: any[];
    userSettings: UserSettings;
}

export default function ProjectionChart({ data, userSettings }: ProjectionChartProps) {
    const { isPrivacyMode } = usePrivacyMode();
    const formatter = GetFormatterForCurrency(userSettings.currency);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const point = payload[0]?.payload || {};
            const balance = point.balance ?? payload[0]?.value;
            const low = point.low;
            const high = point.high;
            return (
                <div className="rounded-lg border bg-background/80 p-4 shadow-xl backdrop-blur-md">
                    <p className="mb-2 text-sm font-bold text-muted-foreground">
                        {new Date(label).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        <p className="text-lg font-black text-foreground">
                            {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(balance)}
                        </p>
                    </div>
                    {typeof low === "number" && typeof high === "number" && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            Range:{" "}
                            {isPrivacyMode
                                ? GetPrivacyMask(formatter)
                                : formatter.format(low)}{" "}
                            -{" "}
                            {isPrivacyMode
                                ? GetPrivacyMask(formatter)
                                : formatter.format(high)}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={data}
                margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                }}
            >
                <defs>
                    <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                            month: "short",
                            year: "2-digit",
                        });
                    }}
                    minTickGap={30}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => {
                        return new Intl.NumberFormat("en-US", {
                            notation: "compact",
                            compactDisplay: "short",
                        }).format(value);
                    }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="low"
                    stackId="band"
                    stroke="none"
                    fill="transparent"
                    isAnimationActive={false}
                />
                <Area
                    type="monotone"
                    dataKey="band"
                    stackId="band"
                    stroke="none"
                    fill="url(#forecastBand)"
                    fillOpacity={1}
                    animationDuration={1500}
                />
                <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
