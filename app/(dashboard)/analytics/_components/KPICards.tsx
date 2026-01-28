"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlassCard from "@/components/GlassCard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { TrendingDown, TrendingUp, PiggyBank, Wallet, FastForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
    userSettings: UserSettings;
    from: Date;
    to: Date;
}

export default function KPICards({ userSettings, from, to }: KPICardsProps) {
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
        <div className="flex w-full flex-wrap gap-4 md:flex-nowrap">
            {/* Savings Rate Card */}
            <SkeletonWrapper isLoading={statsQuery.isFetching}>
                <GlassCard className="group relative flex h-32 w-full flex-col justify-between overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    {/* Atmospheric Glow */}
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/20 blur-[50px] transition-all duration-500 group-hover:bg-emerald-500/30" />
                    <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-teal-500/20 blur-[50px] transition-all duration-500 group-hover:bg-teal-500/30" />

                    <div className="relative z-20 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 backdrop-blur-sm transition-colors group-hover:bg-emerald-500/20">
                            <PiggyBank className="h-6 w-6 text-emerald-500" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
                    </div>

                    <div className="relative z-20 flex items-end justify-between">
                        <h3 className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                            {data?.savingsRate?.current.toFixed(1)}%
                        </h3>
                        <div className={cn(
                            "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium backdrop-blur-sm",
                            data?.savingsRate?.change >= 0
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                        )}>
                            {data?.savingsRate?.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            <span>{Math.abs(data?.savingsRate?.change || 0).toFixed(1)}%</span>
                        </div>
                    </div>
                </GlassCard>
            </SkeletonWrapper>

            {/* Disposable Income Card */}
            <SkeletonWrapper isLoading={statsQuery.isFetching}>
                <GlassCard className="group relative flex h-32 w-full flex-col justify-between overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    {/* Atmospheric Glow */}
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/20 blur-[50px] transition-all duration-500 group-hover:bg-blue-500/30" />
                    <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-cyan-500/20 blur-[50px] transition-all duration-500 group-hover:bg-cyan-500/30" />

                    <div className="relative z-20 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 backdrop-blur-sm transition-colors group-hover:bg-blue-500/20">
                            <Wallet className="h-6 w-6 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Disposable Income</p>
                    </div>

                    <div className="relative z-20 flex items-end justify-between">
                        <h3 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                            {formatter.format(data?.disposableIncome?.current || 0)}
                        </h3>
                        <div className={cn(
                            "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium backdrop-blur-sm",
                            data?.disposableIncome?.change >= 0
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                        )}>
                            {data?.disposableIncome?.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            <span>{Math.abs(data?.disposableIncome?.change || 0).toFixed(0)}</span>
                        </div>
                    </div>
                </GlassCard>
            </SkeletonWrapper>

            {/* Spend Velocity Card */}
            <SkeletonWrapper isLoading={statsQuery.isFetching}>
                <GlassCard className="group relative flex h-32 w-full flex-col justify-between overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    {/* Atmospheric Glow */}
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/20 blur-[50px] transition-all duration-500 group-hover:bg-amber-500/30" />
                    <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-orange-500/20 blur-[50px] transition-all duration-500 group-hover:bg-orange-500/30" />

                    <div className="relative z-20 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 backdrop-blur-sm transition-colors group-hover:bg-amber-500/20">
                            <FastForward className="h-6 w-6 text-amber-500" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Spend Velocity</p>
                    </div>

                    <div className="relative z-20 flex items-end justify-between">
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                                {formatter.format(data?.spendVelocity?.current || 0)}
                            </h3>
                            <span className="text-sm font-medium text-muted-foreground">/day</span>
                        </div>
                        <div className={cn(
                            "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium backdrop-blur-sm",
                            data?.spendVelocity?.change <= 0
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                        )}>
                            {data?.spendVelocity?.change <= 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                            <span>{Math.abs(data?.spendVelocity?.change || 0).toFixed(1)}%</span>
                        </div>
                    </div>
                </GlassCard>
            </SkeletonWrapper>
        </div>
    );
}
