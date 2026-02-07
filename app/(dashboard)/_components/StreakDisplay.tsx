"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import CountUp from "react-countup";
import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

	const nextStreakMilestone = stats
		? getNextMilestone(stats.currentStreak)
		: null;
	const progressToNext =
		nextStreakMilestone && stats
			? (stats.currentStreak / nextStreakMilestone) * 100
			: 0;

	return (
		<div className="grid gap-3 md:grid-cols-3 3xl:gap-4">
			<SkeletonWrapper isLoading={isLoading}>
				<StreakCard
					value={stats?.currentStreak || 0}
					title="Current Streak"
					subtitle="days in a row"
					icon={<Flame className="h-5 w-5 text-white 3xl:h-5 3xl:w-5" />}
					iconBg="from-orange-500 to-red-600"
					gradientBg="from-orange-500/10 via-red-500/10 to-pink-500/10"
					progress={progressToNext}
					nextMilestone={nextStreakMilestone}
					isActive={stats ? stats.currentStreak >= 7 : false}
					activeMessage="You're on fire!"
				/>
			</SkeletonWrapper>

			<SkeletonWrapper isLoading={isLoading}>
				<StreakCard
					value={stats?.longestStreak || 0}
					title="Best Streak"
					subtitle="personal record"
					icon={<Trophy className="h-5 w-5 text-white 3xl:h-5 3xl:w-5" />}
					iconBg="from-amber-500 to-yellow-600"
					gradientBg="from-amber-500/10 via-yellow-500/10 to-orange-500/10"
					isRecord={
						stats
							? stats.currentStreak === stats.longestStreak &&
							stats.currentStreak > 0
							: false
					}
					activeMessage="New record!"
				/>
			</SkeletonWrapper>

			<SkeletonWrapper isLoading={isLoading}>
				<StreakCard
					value={stats?.totalPoints || 0}
					title="Total Points"
					subtitle={`${stats?.totalAchievements || 0} achievement${(stats?.totalAchievements || 0) !== 1 ? "s" : ""} unlocked`}
					icon={<Target className="h-5 w-5 text-white 3xl:h-5 3xl:w-5" />}
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
		<Card className="group relative flex h-full flex-col overflow-hidden">
			{/* Background gradient */}
			<div
				className={cn(
					"pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
					gradientBg,
				)}
			/>

			<CardHeader className="relative p-4 3xl:p-6 3xl:pb-3">
				<CardTitle className="flex items-center gap-2 text-base font-semibold 3xl:text-base">
					<div
						className={cn(
							"flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-105",
							"3xl:h-10 3xl:w-10",
							iconBg,
						)}>
						{icon}
					</div>
					<span>{title}</span>
				</CardTitle>
			</CardHeader>

			<CardContent className="relative flex flex-1 flex-col space-y-2 p-4 pt-0 3xl:p-6 3xl:pt-0">
				{/* Value */}
				<div>
					<CountUp
						preserveValue
						redraw={false}
						end={value}
						decimals={0}
						formattingFn={formatValue}
						className="text-2xl font-bold 3xl:text-3xl"
						duration={2}
					/>
					{subtitle && (
						<p className="text-xs text-muted-foreground 3xl:text-sm">
							{subtitle}
						</p>
					)}
				</div>

				{/* Progress Section */}
				{progress !== undefined && nextMilestone ? (
					<div className="space-y-1">
						<div className="flex justify-between text-[9px] text-muted-foreground/80 uppercase tracking-wider">
							<span>Progress</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<Progress value={progress} className="h-1" />
						<p className="text-[9px] text-muted-foreground text-right mt-0.5">
							Next: {nextMilestone} days
						</p>
					</div>
				) : (
					<div className="h-5" />
				)}

				{/* Active Message / Trend */}
				<div className="mt-auto h-4 flex items-center">
					{(isActive || isRecord) && activeMessage ? (
						<div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 animate-in fade-in slide-in-from-bottom-1">
							{isActive ? (
								<Flame className="h-3 w-3" />
							) : (
								<Trophy className="h-3 w-3" />
							)}
							{activeMessage}
						</div>
					) : showTrend && trendValue !== undefined && trendValue > 0 ? (
						<div className="flex items-center gap-1 text-xs font-medium text-emerald-500 animate-in fade-in slide-in-from-bottom-1">
							<TrendingUp className="h-3 w-3" />
							<span>Unlocked recently</span>
						</div>
					) : (
						<div className="h-3">&nbsp;</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function getNextMilestone(currentStreak: number): number | null {
	const milestones = [3, 7, 14, 30, 60, 100, 365];
	return milestones.find((m) => m > currentStreak) || null;
}
