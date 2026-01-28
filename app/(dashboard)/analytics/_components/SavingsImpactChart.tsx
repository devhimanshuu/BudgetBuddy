"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GlassCard from "@/components/GlassCard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SavingsImpactProps {
    userSettings: UserSettings;
}

export default function SavingsImpactChart({ userSettings }: SavingsImpactProps) {
    const formatter = useMemo(() => {
        return GetFormatterForCurrency(userSettings.currency);
    }, [userSettings.currency]);

    const impactQuery = useQuery({
        queryKey: ["analytics", "savings-impact"],
        queryFn: () => fetch("/api/analytics/savings-impact").then((res) => res.json()),
    });

    const data = impactQuery.data;
    const goalImpacts = data?.goalImpacts || [];
    const avgMonthlySavings = data?.avgMonthlySavings || 0;

    return (
        <GlassCard className="col-span-12">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10" />

            <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 3xl:text-2xl">
                    <span className="text-2xl">🌈</span>
                    Savings Goals Impact
                </CardTitle>
                <CardDescription>
                    Based on your average monthly savings of{" "}
                    <span className="font-semibold text-foreground">
                        {formatter.format(avgMonthlySavings)}
                    </span>{" "}
                    (last 3 months)
                </CardDescription>
            </CardHeader>
            <CardContent className="relative">
                <SkeletonWrapper isLoading={impactQuery.isFetching}>
                    {goalImpacts.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {goalImpacts.map((goal: any) => {
                                const status = goal.impactStatus;
                                const isDelayed = status === "delayed" || status === "critical-delay";
                                const isAhead = status === "ahead";
                                const isImpossible = status === "impossible";

                                return (
                                    <GlassCard key={goal.id} className="relative overflow-hidden border-2">
                                        <div
                                            className="absolute left-0 top-0 h-full w-1"
                                            style={{ backgroundColor: goal.color }}
                                        />
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{goal.icon}</span>
                                                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                                                </div>
                                                {status === "ahead" && <TrendingUp className="h-5 w-5 text-emerald-500" />}
                                                {status === "delayed" && <TrendingDown className="h-5 w-5 text-orange-500" />}
                                                {status === "critical-delay" && <AlertCircle className="h-5 w-5 text-red-500" />}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Comparison Text */}
                                            <div className="rounded-lg bg-muted p-3">
                                                {isImpossible ? (
                                                    <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                                                        <AlertCircle className="h-4 w-4" />
                                                        Impossible to reach at current rate
                                                    </p>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-muted-foreground">Projection</p>
                                                        <p className={cn(
                                                            "text-sm font-semibold",
                                                            isAhead && "text-emerald-600",
                                                            isDelayed && "text-orange-600",
                                                            status === "critical-delay" && "text-red-600"
                                                        )}>
                                                            {isAhead && "Reached ahead of schedule!"}
                                                            {status === "on-track" && "On track to reach on time."}
                                                            {isDelayed && `Likely reached ${Math.abs(goal.delayInMonths).toFixed(1)} months late.`}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Exp: {format(new Date(goal.estimatedDate), "MMM yyyy")}
                                                            (Target: {format(new Date(goal.targetDate), "MMM yyyy")})
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span>Target: {formatter.format(goal.targetAmount)}</span>
                                                    <span>{((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%</span>
                                                </div>
                                                <Progress
                                                    value={(goal.currentAmount / goal.targetAmount) * 100}
                                                    className="h-2"
                                                    style={{
                                                        "--progress-color": goal.color,
                                                    } as React.CSSProperties}
                                                />
                                            </div>

                                            {/* Call to action */}
                                            {isDelayed && (
                                                <p className="text-[10px] text-muted-foreground bg-orange-50 dark:bg-orange-950/20 p-2 rounded border border-orange-100 dark:border-orange-900/50">
                                                    💡 Increase savings by <span className="font-bold text-orange-600">{formatter.format((goal.targetAmount - goal.currentAmount) / (differenceInDays(new Date(goal.targetDate), new Date()) / 30.44) - avgMonthlySavings)}</span> /mo to stay on track.
                                                </p>
                                            )}
                                        </CardContent>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <span className="text-4xl mb-4">🎯</span>
                            <p className="text-muted-foreground font-medium">No active savings goals found.</p>
                            <p className="text-sm text-muted-foreground">Create a goal to see how your spending affects your dreams.</p>
                        </div>
                    )}
                </SkeletonWrapper>
            </CardContent>
        </GlassCard>
    );
}
