"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, TrendingUp, Crown, Zap, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import CountUp from "react-countup";
import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LevelInfo {
	level: number;
	minPoints: number;
	title: string;
}

interface GamificationStats {
	currentStreak: number;
	longestStreak: number;
	totalPoints: number;
	achievements: any[];
	totalAchievements: number;
	totalTransactions: number;
	level: LevelInfo;
	nextLevel: LevelInfo;
	levelProgress: number;
}

export default function StreakDisplay() {
	const { data: stats, isLoading } = useQuery<GamificationStats>({
		queryKey: ["gamification"],
		queryFn: () => fetch("/api/gamification").then((res) => res.json()),
	});

	const nextStreakMilestone = stats
		? getNextMilestone(stats.currentStreak)
		: null;

	// Calculate streak progress relative to previous milestone (0) or simple percentage of next?
	// Simple percentage of next milestone makes sense for streaks.
	const streakProgress =
		nextStreakMilestone && stats
			? (stats.currentStreak / nextStreakMilestone) * 100
			: 0;

	return (
		<div className="grid gap-4 md:grid-cols-3">
			{/* Current Streak */}
			<SkeletonWrapper isLoading={isLoading}>
				<StreakCard
					label="Current Streak"
					value={stats?.currentStreak || 0}
					subtext="days in a row"
					icon={<Flame className="h-5 w-5 text-white" />}
					iconGradient="from-orange-500 to-red-600"

					progress={streakProgress}
					progressLabel={nextStreakMilestone ? `Next: ${nextStreakMilestone} days` : undefined}

					activeMessage={stats && stats.currentStreak >= 3 ? "You're on fire!" : undefined}
				/>
			</SkeletonWrapper>

			{/* Total Points / Level */}
			<SkeletonWrapper isLoading={isLoading}>
				<StreakCard
					label={`Level ${stats?.level?.level || 1}`}
					value={stats?.totalPoints || 0}
					subtext={stats?.level?.title || "Novice Saver"}
					icon={<Crown className="h-5 w-5 text-white" />}
					iconGradient="from-indigo-500 to-purple-600"

					progress={stats?.levelProgress || 0}
					progressLabel={stats?.nextLevel ? `${stats.totalPoints} / ${stats.nextLevel.minPoints} pts` : "Max Level"}

					activeMessage={`${stats?.totalAchievements || 0} achievements unlocked`}
				/>
			</SkeletonWrapper>

			{/* Best Streak / Records */}
			<SkeletonWrapper isLoading={isLoading}>
				<StreakCard
					label="Best Streak"
					value={stats?.longestStreak || 0}
					subtext="personal record"
					icon={<Trophy className="h-5 w-5 text-white" />}
					iconGradient="from-amber-400 to-yellow-600"

					activeMessage={stats && stats.currentStreak === stats.longestStreak && stats.currentStreak > 0 ? "New Record!" : undefined}
				/>
			</SkeletonWrapper>
		</div>
	);
}

interface StreakCardProps {
	label: string;
	value: number;
	subtext: string;
	icon: React.ReactNode;
	iconGradient: string;

	progress?: number;
	progressLabel?: string;
	activeMessage?: string;
}

function StreakCard({
	label,
	value,
	subtext,
	icon,
	iconGradient,
	progress,
	progressLabel,
	activeMessage
}: StreakCardProps) {
	return (
		<Card className="group relative overflow-hidden border-muted/50 transition-all hover:shadow-lg hover:border-muted-foreground/20">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
				<div className="space-y-1">
					<CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
						{label}
					</CardTitle>
					<div className="text-2xl font-bold">
						<CountUp end={value} duration={2} separator="," />
					</div>
				</div>
				<div className={cn("p-2.5 rounded-xl shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300 bg-gradient-to-br", iconGradient)}>
					{icon}
				</div>
			</CardHeader>
			<CardContent className="relative z-10">
				<p className="text-sm font-semibold text-foreground mb-4">
					{subtext}
				</p>

				{progress !== undefined && (
					<div className="space-y-1.5">
						<Progress value={progress} className="h-1.5 bg-muted/50" indicator={cn("bg-gradient-to-r", iconGradient)} />
						{progressLabel && (
							<p className="text-[10px] text-muted-foreground text-right w-full">
								{progressLabel}
							</p>
						)}
					</div>
				)}

				{activeMessage && (
					<div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-500 animate-in fade-in slide-in-from-bottom-2">
						<TrendingUp className="h-3.5 w-3.5" />
						{activeMessage}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function getNextMilestone(currentStreak: number): number | null {
	const milestones = [3, 7, 14, 30, 60, 100, 365];
	return milestones.find((m) => m > currentStreak) || null;
}
