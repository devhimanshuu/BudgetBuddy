"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlassCard from "@/components/GlassCard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { TrendingDown, TrendingUp, PiggyBank, Wallet, FastForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
    userSettings: UserSettings;
    from: Date;
    to: Date;
    isPrivacyMode?: boolean;
}

export default function KPICards({ userSettings, from, to, isPrivacyMode = false }: KPICardsProps) {
    const formatter = useMemo(() => {
        return GetFormatterForCurrency(userSettings.currency);
    }, [userSettings.currency]);

    const statsQuery = useQuery({
        queryKey: ["analytics", "stats", from, to],
        queryFn: () =>
            fetch(
                `/api/analytics/stats?from=${from.toISOString()}&to=${to.toISOString()}`
            ).then((res) => res.json()),
    });

    const data = statsQuery.data;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 2xl:gap-6 4xl:gap-8">
            {/* Savings Rate Card */}
            <SkeletonWrapper isLoading={statsQuery.isFetching}>
                <GlassCard className="h-full overflow-hidden">
                    <div className="flex flex-col h-full relative">
                        {/* Atmospheric Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent pointer-events-none" />

                        <CardHeader className="relative p-6 shrink-0">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-2 shadow-lg shadow-emerald-500/20">
                                        <PiggyBank className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Savings Rate</span>
                                </div>
                                {data?.savingsRate && (
                                    <div className={cn(
                                        "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
                                        data?.savingsRate?.change >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                                    )}>
                                        {data?.savingsRate?.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                        <span>{isPrivacyMode ? "*.*%" : `${Math.abs(data?.savingsRate?.change || 0).toFixed(1)}%`}</span>
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative p-6 pt-0">
                            <div className="flex flex-col">
                                <h3 className="text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                    {isPrivacyMode ? "**.*%" : `${data?.savingsRate?.current.toFixed(1)}%`}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Percent of net income saved</p>
                            </div>
                        </CardContent>
                    </div>
                </GlassCard>
            </SkeletonWrapper>

            {/* Disposable Income Card */}
            <SkeletonWrapper isLoading={statsQuery.isFetching}>
                <GlassCard className="h-full overflow-hidden">
                    <div className="flex flex-col h-full relative">
                        {/* Atmospheric Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent pointer-events-none" />

                        <CardHeader className="relative p-6 shrink-0">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-2 shadow-lg shadow-blue-500/20">
                                        <Wallet className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Disposable Income</span>
                                </div>
                                {data?.disposableIncome && (
                                    <div className={cn(
                                        "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
                                        data?.disposableIncome?.change >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                                    )}>
                                        {data?.disposableIncome?.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                        <span>{isPrivacyMode ? "***" : formatter.format(Math.abs(data?.disposableIncome?.change || 0)).replace(/[^\d]/g, '')}</span>
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative p-6 pt-0">
                            <div className="flex flex-col">
                                <h3 className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                                    {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(data?.disposableIncome?.current || 0)}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Income after all taxes & expenses</p>
                            </div>
                        </CardContent>
                    </div>
                </GlassCard>
            </SkeletonWrapper>

            {/* Spend Velocity Card */}
            <SkeletonWrapper isLoading={statsQuery.isFetching}>
                <GlassCard className="h-full overflow-hidden">
                    <div className="flex flex-col h-full relative">
                        {/* Atmospheric Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent pointer-events-none" />

                        <CardHeader className="relative p-6 shrink-0">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-2 shadow-lg shadow-amber-500/20">
                                        <FastForward className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Spend Velocity</span>
                                </div>
                                {data?.spendVelocity && (
                                    <div className={cn(
                                        "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
                                        data?.spendVelocity?.change <= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                                    )}>
                                        {data?.spendVelocity?.change <= 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                                        <span>{isPrivacyMode ? "*.*%" : `${Math.abs(data?.spendVelocity?.change || 0).toFixed(1)}%`}</span>
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative p-6 pt-0">
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-4xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                                        {isPrivacyMode ? GetPrivacyMask(formatter, "***") : formatter.format(data?.spendVelocity?.current || 0)}
                                    </h3>
                                    <span className="text-sm font-medium text-muted-foreground">/day</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Average daily spending rate</p>
                            </div>
                        </CardContent>
                    </div>
                </GlassCard>
            </SkeletonWrapper>
        </div>
    );
}
