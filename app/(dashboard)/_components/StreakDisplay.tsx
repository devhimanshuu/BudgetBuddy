"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import GlassCard from "@/components/GlassCard";
import CountUp from "react-countup";
import { useCallback } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GamificationStats {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    achievements: any[];
    totalAchievements: number;
    totalTransactions: number;
}

export default function StreakDisplay() {
    const { data: stats, isLoading } = useQuery<GamificationStats>({
        queryKey: ["gamification"],
        queryFn: () => fetch("/api/gamification").then((res) => res.json()),
    });

    const nextStreakMilestone = stats ? getNextMilestone(stats.currentStreak) : null;
    const progressToNext = nextStreakMilestone && stats
        ? (stats.currentStreak / nextStreakMilestone) * 100
        : 0;

    return (
        <div className="grid gap-4 md:grid-cols-3 3xl:gap-6">
            <SkeletonWrapper isLoading={isLoading}>
                <StreakCard
                    value={stats?.currentStreak || 0}
                    title="Current Streak"
                    subtitle="days in a row"
                    icon={<Flame className="h-5 w-5 text-white 3xl:h-6 3xl:w-6" />}
                    iconBg="from-orange-500 to-red-600"
                    gradientBg="from-orange-500/10 via-red-500/10 to-pink-500/10"
                    progress={progressToNext}
                    nextMilestone={nextStreakMilestone}
                    isActive={stats ? stats.currentStreak >= 7 : false}
                    activeMessage="🔥 You're on fire!"
                />
            </SkeletonWrapper>

            <SkeletonWrapper isLoading={isLoading}>
                <StreakCard
                    value={stats?.longestStreak || 0}
                    title="Best Streak"
                    subtitle="personal record"
                    icon={<Trophy className="h-5 w-5 text-white 3xl:h-6 3xl:w-6" />}
                    iconBg="from-amber-500 to-yellow-600"
                    gradientBg="from-amber-500/10 via-yellow-500/10 to-orange-500/10"
                    isRecord={stats ? stats.currentStreak === stats.longestStreak && stats.currentStreak > 0 : false}
                    activeMessage="🏆 New record!"
                />
            </SkeletonWrapper>

            <SkeletonWrapper isLoading={isLoading}>
                <StreakCard
                    value={stats?.totalPoints || 0}
                    title="Total Points"
                    subtitle={`${stats?.totalAchievements || 0} achievement${(stats?.totalAchievements || 0) !== 1 ? 's' : ''} unlocked`}
                    icon={<Target className="h-5 w-5 text-white 3xl:h-6 3xl:w-6" />}
                    iconBg="from-emerald-500 to-teal-600"
                    gradientBg="from-emerald-500/10 via-teal-500/10 to-cyan-500/10"
                    showTrend
                    trendValue={stats?.totalAchievements || 0}
                />
            </SkeletonWrapper>
        </div>
    );
}

function StreakCard({
    value,
    title,
    subtitle,
    icon,
    iconBg,
    gradientBg,
    progress,
    nextMilestone,
    isActive,
    isRecord,
    activeMessage,
    showTrend,
    trendValue,
}: {
    value: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
    gradientBg: string;
    progress?: number;
    nextMilestone?: number | null;
    isActive?: boolean;
    isRecord?: boolean;
    activeMessage?: string;
    showTrend?: boolean;
    trendValue?: number;
}) {
    const formatValue = useCallback((val: number) => {
        return val.toLocaleString();
    }, []);

    return (
        <GlassCard className="h-full" hover={true} animate={true}>
            <div className="flex flex-col h-full">
                {/* Colored gradient background removed to sync with theme UI */}
                {/* <div className={cn("absolute inset-0 bg-gradient-to-br", gradientBg)} /> */}

                <CardHeader className="relative p-3 pb-0 3xl:p-4 3xl:pb-0 shrink-0">
                    <CardTitle className="flex items-center gap-2">
                        <div className={cn("rounded-lg bg-gradient-to-br p-1.5 3xl:p-2", iconBg)}>
                            {icon}
                        </div>
                        <span className="text-sm font-medium 3xl:text-base">{title}</span>
                    </CardTitle>
                </CardHeader>

                <CardContent className="relative flex flex-col justify-between grow space-y-2 p-3 pt-0 3xl:p-4 3xl:pt-0">
                    {/* Main Value and Subtitle */}
                    <div className="pt-2">
                        <CountUp
                            preserveValue
                            redraw={false}
                            end={value}
                            decimals={0}
                            formattingFn={formatValue}
                            className="text-5xl font-bold 3xl:text-6xl block mb-2"
                            duration={2}
                        />
                        <p className="text-xs text-muted-foreground 3xl:text-sm line-clamp-1 h-4">{subtitle}</p>
                    </div>

                    {/* Footer Section - Rigid Height Container */}
                    <div className="space-y-1 mt-auto pt-1">
                        {/* Progress Bar Section */}
                        <div className={cn("space-y-1", !nextMilestone && "invisible")}>
                            <div className="flex justify-between text-[10px] text-muted-foreground 3xl:text-xs">
                                <span>Next milestone</span>
                                <span className="font-medium">{nextMilestone || 0} days</span>
                            </div>
                            <Progress
                                value={progress || 0}
                                className="h-1.5 3xl:h-2"
                            />
                        </div>

                        {/* Message/Trend Section - Fixed height container */}
                        <div className="h-5 flex items-center">
                            {(isActive || isRecord) && activeMessage ? (
                                <div className="flex items-center gap-1 text-xs font-medium 3xl:text-sm animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-primary">{activeMessage}</span>
                                </div>
                            ) : showTrend && trendValue !== undefined && trendValue > 0 ? (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 3xl:text-xs animate-in fade-in slide-in-from-bottom-2">
                                    <TrendingUp className="h-2.5 w-2.5 3xl:h-3 3xl:w-3" />
                                    <span className="font-medium">Unlocked recently</span>
                                </div>
                            ) : (
                                /* Empty spacer to reserve height */
                                <div className="text-xs 3xl:text-sm">&nbsp;</div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </div>
        </GlassCard>
    );
}

function getNextMilestone(currentStreak: number): number | null {
    const milestones = [3, 7, 14, 30, 60, 100, 365];
    return milestones.find((m) => m > currentStreak) || null;
}
