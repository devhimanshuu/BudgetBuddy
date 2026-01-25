"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            <SkeletonWrapper isLoading={statsQuery.isFetching}>
                <Card className="flex h-24 w-full items-center justify-between p-4">
                    <div className="flex flex-col items-start gap-0">
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            <PiggyBank className="h-4 w-4 text-emerald-500" />
                            Savings Rate
                        </p>
                        <h3 className="text-2xl font-bold">
                            {data?.savingsRate?.current.toFixed(1)}%
                        </h3>
                        <div className={cn(
                            "flex items-center gap-1 text-xs",
                            data?.savingsRate?.change >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                            {data?.savingsRate?.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(data?.savingsRate?.change || 0).toFixed(1)}% vs prev. period
                        </div>
                    </div>
                </Card>
            </SkeletonWrapper>

            <SkeletonWrapper isLoading={statsQuery.isFetching}>
                <Card className="flex h-24 w-full items-center justify-between p-4">
                    <div className="flex flex-col items-start gap-0">
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-blue-500" />
                            Disposable Income
                        </p>
                        <h3 className="text-2xl font-bold">
                            {formatter.format(data?.disposableIncome?.current || 0)}
                        </h3>
                        <div className={cn(
                            "flex items-center gap-1 text-xs",
                            data?.disposableIncome?.change >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                            {data?.disposableIncome?.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatter.format(Math.abs(data?.disposableIncome?.change || 0))} vs prev. period
                        </div>
                    </div>
                </Card>
            </SkeletonWrapper>

            <SkeletonWrapper isLoading={statsQuery.isFetching}>
                <Card className="flex h-24 w-full items-center justify-between p-4">
                    <div className="flex flex-col items-start gap-0">
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            <FastForward className="h-4 w-4 text-orange-500" />
                            Spend Velocity
                        </p>
                        <h3 className="text-2xl font-bold">
                            {formatter.format(data?.spendVelocity?.current || 0)}
                            <span className="text-xs text-muted-foreground font-normal ml-1">/day</span>
                        </h3>
                        <div className={cn(
                            "flex items-center gap-1 text-xs",
                            data?.spendVelocity?.change <= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                            {data?.spendVelocity?.change <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                            {Math.abs(data?.spendVelocity?.change || 0).toFixed(1)}% vs prev. period
                        </div>
                    </div>
                </Card>
            </SkeletonWrapper>
        </div>
    );
}
