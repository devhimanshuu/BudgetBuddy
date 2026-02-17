"use client";

import { useQuery } from "@tanstack/react-query";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ACHIEVEMENTS } from "@/lib/gamification";
import GlassCard from "@/components/GlassCard";
import { cn } from "@/lib/utils";

interface LevelInfo {
    level: number;
    minPoints: number;
    title: string;
}

interface Achievement {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    tier: string;
    points: number;
    requirement: number | null;
    unlockedAt?: Date;
}

interface GamificationStats {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    achievements: Achievement[];
    totalAchievements: number;
    totalTransactions: number;
    level: LevelInfo;
    nextLevel: LevelInfo;
    levelProgress: number;
}

const TIER_COLORS = {
    bronze: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900",
    silver: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900",
    platinum: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-400 border-violet-200 dark:border-violet-900",
};

export default function AchievementsDisplay() {
    const { data: stats, isLoading } = useQuery<GamificationStats>({
        queryKey: ["gamification"],
        queryFn: () => fetch("/api/gamification").then((res) => res.json()),
    });

    if (isLoading || !stats) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const unlockedKeys = new Set(stats.achievements.map((a) => a.key));
    const allAchievements = Object.values(ACHIEVEMENTS);

    const categorizedAchievements = {
        all: allAchievements,
        streak: allAchievements.filter((a) => a.category === "streak"),
        budget: allAchievements.filter((a) => a.category === "budget"),
        savings: allAchievements.filter((a) => a.category === "savings"),
        general: allAchievements.filter((a) => a.category === "general"),
    };

    const renderAchievement = (achievement: typeof ACHIEVEMENTS[keyof typeof ACHIEVEMENTS]) => {
        const isUnlocked = unlockedKeys.has(achievement.key);
        const unlockedData = stats.achievements.find((a) => a.key === achievement.key);

        return (
            <GlassCard
                key={achievement.key}
                hover={true}
                className={cn(
                    "relative transition-all duration-300",
                    !isUnlocked && "opacity-60 grayscale-[0.8]"
                )}
            >
                {/* Status Indicator */}
                <div className={cn(
                    "absolute top-0 right-0 p-3",
                    !isUnlocked ? "text-muted-foreground/50" : "text-emerald-500"
                )}>
                    {!isUnlocked && <Lock className="h-4 w-4" />}
                </div>

                {/* Progress Bar Background for unlocked items */}
                {isUnlocked && (
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-primary/20">
                        <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                    </div>
                )}

                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm transition-transform duration-300 md:h-14 md:w-14 md:text-3xl",
                                isUnlocked
                                    ? "bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-white/5"
                                    : "bg-muted/50"
                            )}>
                                <span className={cn(
                                    "filter drop-shadow-md transition-all duration-300",
                                    isUnlocked && "group-hover:scale-110"
                                )}>
                                    {achievement.icon}
                                </span>
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold md:text-lg">
                                    {achievement.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-xs md:text-sm">
                                    {achievement.description}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "capitalize border shadow-sm",
                                    TIER_COLORS[achievement.tier as keyof typeof TIER_COLORS]
                                )}
                            >
                                {achievement.tier}
                            </Badge>
                            <span className="text-xs font-semibold text-primary/80 md:text-sm">
                                +{achievement.points} pts
                            </span>
                        </div>

                        {isUnlocked && unlockedData?.unlockedAt && (
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(unlockedData.unlockedAt), {
                                    addSuffix: true,
                                })}
                            </span>
                        )}
                    </div>
                </CardContent>
            </GlassCard>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Achievements</h2>
                    <p className="text-muted-foreground">
                        You&apos;ve unlocked <span className="font-bold text-primary">{stats.totalAchievements}</span> of <span className="font-bold">{allAchievements.length}</span> achievements
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-2 md:mt-0">
                    <GlassCard className="px-6 py-4" hover={false}>
                        <div className="text-center sm:text-right">
                            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600 md:text-4xl">
                                {stats.level?.level || 1}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Level
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 font-semibold">
                                {stats.level?.title || "Novice"}
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="px-6 py-4" hover={false}>
                        <div className="text-center sm:text-right">
                            <div className="text-3xl font-bold text-primary md:text-4xl">
                                {stats.totalPoints.toLocaleString()}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Total Points
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {stats.nextLevel ? `${stats.nextLevel.minPoints - stats.totalPoints} to Level ${stats.nextLevel.level}` : "Max Level"}
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 p-1 bg-muted/50 backdrop-blur-sm">
                    <TabsTrigger value="all" className="data-[state=active]:bg-background/80 data-[state=active]:backdrop-blur-sm">All</TabsTrigger>
                    <TabsTrigger value="streak" className="data-[state=active]:bg-background/80 data-[state=active]:backdrop-blur-sm">Streaks</TabsTrigger>
                    <TabsTrigger value="budget" className="data-[state=active]:bg-background/80 data-[state=active]:backdrop-blur-sm">Budget</TabsTrigger>
                    <TabsTrigger value="savings" className="data-[state=active]:bg-background/80 data-[state=active]:backdrop-blur-sm">Savings</TabsTrigger>
                    <TabsTrigger value="general" className="data-[state=active]:bg-background/80 data-[state=active]:backdrop-blur-sm">General</TabsTrigger>
                </TabsList>

                {Object.entries(categorizedAchievements).map(([category, achievements]) => (
                    <TabsContent key={category} value={category} className="mt-6 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {achievements.map(renderAchievement)}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
