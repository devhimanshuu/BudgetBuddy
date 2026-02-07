"use client";

import React, { useState, useMemo } from "react";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import {
	Sparkles,
	TrendingUp,
	TrendingDown,
	Calendar,
	Info,
	ChevronRight,
	Target,
	Clock,
	Goal,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { GetFormatterForCurrency } from "@/lib/helper";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";
import ProjectionChart from "./ProjectionChart";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ForecastingContentProps {
	userSettings: UserSettings;
}

export default function ForecastingContent({
	userSettings,
}: ForecastingContentProps) {
	const [months, setMonths] = useState("6");
	const { isPrivacyMode } = usePrivacyMode();

	const forecastQuery = useQuery({
		queryKey: ["forecasting", months],
		queryFn: () =>
			fetch(`/api/forecasting?months=${months}`).then((res) => res.json()),
	});

	const formatter = useMemo(() => {
		return GetFormatterForCurrency(userSettings.currency);
	}, [userSettings.currency]);

	const data = forecastQuery.data || {
		projection: [],
		currentBalance: 0,
		stats: {},
	};
	const insufficientData = data.stats?.insufficientData;
	const minDaysRequired = data.stats?.minDaysRequired ?? 60;
	const availableDays = data.stats?.availableDays ?? 0;
	const lastBalance =
		data.projection.length > 0
			? data.projection[data.projection.length - 1].balance
			: 0;
	const lastPoint =
		data.projection.length > 0
			? data.projection[data.projection.length - 1]
			: null;
	const projectedChange = lastBalance - data.currentBalance;
	const projectedChangePct =
		data.currentBalance !== 0
			? (projectedChange / data.currentBalance) * 100
			: 0;
	const isGrowth = lastBalance >= data.currentBalance;

	return (
		<div className="space-y-6 3xl:space-y-8 4xl:space-y-10">
			{/* Header Section */}
			<div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-3xl font-bold tracking-tight 3xl:text-4xl 4xl:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
							Crystal Ball Forecast
						</h1>
					</div>
					<p className="mt-2 text-muted-foreground 3xl:text-lg 4xl:text-xl">
						Peek into your financial future based on current trends and
						recurring items.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Badge variant="secondary" className="px-3 py-1 4xl:text-lg">
						<Clock className="mr-1 h-3 w-3 4xl:h-5 4xl:w-5" />
						Real-time Projection
					</Badge>
					<Select value={months} onValueChange={setMonths}>
						<SelectTrigger className="w-[180px] 3xl:w-[220px] 3xl:h-12 3xl:text-lg">
							<SelectValue placeholder="Select timeframe" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="3">Next 3 Months</SelectItem>
							<SelectItem value="6">Next 6 Months</SelectItem>
							<SelectItem value="12">Next 12 Months</SelectItem>
							<SelectItem value="24">Next 2 Years</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{insufficientData && (
				<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground 4xl:text-lg">
					Forecast needs at least {minDaysRequired} days of transaction history.
					Currently have {availableDays} days.
				</div>
			)}

			{/* Main Grid */}
			<div className="grid gap-6 md:grid-cols-4">
				{/* Key Stats Cards */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="col-span-1">
					<GlassCard className="h-full overflow-hidden border-primary/20">
						<div className="absolute top-0 right-0 p-4 opacity-10">
							<Target className="h-24 w-24 text-primary" />
						</div>
						<CardHeader className="pb-2">
							<CardDescription className="4xl:text-lg">
								Projected Balance
							</CardDescription>
							<CardTitle className="text-3xl 3xl:text-4xl 4xl:text-5xl font-black">
								{isPrivacyMode ? "****" : formatter.format(lastBalance)}
							</CardTitle>
						</CardHeader>
						<div className="p-6 pt-0">
							<div
								className={`flex items-center gap-1 text-sm font-medium 4xl:text-lg ${isGrowth ? "text-emerald-500" : "text-red-500"}`}>
								{isGrowth ? (
									<TrendingUp className="h-4 w-4" />
								) : (
									<TrendingDown className="h-4 w-4" />
								)}
								{isGrowth ? "Growth" : "Decline"} of{" "}
								{Math.abs(
									((lastBalance - data.currentBalance) /
										(data.currentBalance || 1)) *
										100,
								).toFixed(1)}
								%
							</div>
							<p className="mt-4 text-sm text-muted-foreground 4xl:text-lg">
								By{" "}
								{new Date(
									data.projection[data.projection.length - 1]?.date ||
										new Date(),
								).toLocaleDateString("en-US", {
									month: "long",
									year: "numeric",
								})}
							</p>
						</div>
					</GlassCard>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className="col-span-1 md:col-span-3">
					<SkeletonWrapper isLoading={forecastQuery.isFetching}>
						<GlassCard className="h-full">
							<div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10" />
							<CardHeader className="relative">
								<CardTitle className="flex items-center gap-2 3xl:text-2xl">
									Financial Trajectory
								</CardTitle>
								<CardDescription>
									Estimated balance over the next {months} months
								</CardDescription>
							</CardHeader>
							<div className="relative p-6 h-[400px] 3xl:h-[500px] 4xl:h-[600px]">
								<ProjectionChart
									data={data.projection}
									userSettings={userSettings}
								/>
							</div>
						</GlassCard>
					</SkeletonWrapper>
				</motion.div>
			</div>

			{/* Insights Row */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<GlassCard>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Goal className="h-5 w-5 text-primary" />
							Forecast Summary
						</CardTitle>
					</CardHeader>
					<div className="p-6 pt-0 space-y-3 text-sm text-muted-foreground 4xl:text-lg">
						<div className="flex items-center justify-between">
							<span>Median Daily Net</span>
							<span className="font-semibold text-foreground">
								{typeof data.stats?.medianDailyNet === "number"
									? isPrivacyMode
										? "****"
										: formatter.format(data.stats.medianDailyNet)
									: "--"}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span>Confidence Band</span>
							<span className="font-semibold text-foreground">
								{typeof data.stats?.dailyBand === "number"
									? isPrivacyMode
										? "****"
										: formatter.format(data.stats.dailyBand)
									: "--"}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span>History Used</span>
							<span className="font-semibold text-foreground">
								{data.stats?.availableDays ?? 0}/
								{data.stats?.historyDays ?? 180} days
							</span>
						</div>
						<div className="pt-2 space-y-1 text-xs text-muted-foreground/80 4xl:text-sm">
							<p>
								<strong className="text-foreground">Median Daily Net:</strong>{" "}
								Typical daily cashflow (income minus expense), less affected by
								outliers.
							</p>
							<p>
								<strong className="text-foreground">Confidence Band:</strong>{" "}
								Expected daily variation range around the baseline.
							</p>
							<p>
								<strong className="text-foreground">History Used:</strong> Days
								of past transactions used to build the model.
							</p>
						</div>
						<p className="text-xs text-muted-foreground">
							{data.stats?.summary ||
								"Based on recent history with seasonality, outlier capping, and a confidence band."}
						</p>
					</div>
				</GlassCard>
				<GlassCard>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Info className="h-5 w-5 text-blue-400" />
							How it works
						</CardTitle>
					</CardHeader>
					<div className="p-6 pt-0 space-y-3 text-sm text-muted-foreground 4xl:text-lg">
						<p>Predictions are calculated using:</p>
						<ul className="list-disc pl-4 space-y-1">
							<li>Last 180 days median daily net flow</li>
							<li>Weekday seasonality from historical averages</li>
							<li>Recurring incomes & expenses</li>
							<li>Outlier capping at the 95th percentile</li>
							<li>Confidence band from 1.5× MAD</li>
						</ul>
						<p className="italic text-xs pt-2">
							Note: This is a mathematical projection, not financial advice.
						</p>
					</div>
				</GlassCard>

				<GlassCard className="bg-gradient-to-br from-primary/5 to-purple-500/5">
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Sparkles className="h-5 w-5 text-yellow-400" />
							Smart Insights
						</CardTitle>
					</CardHeader>
					<div className="p-6 pt-0">
						<p className="text-sm 4xl:text-lg">
							{isGrowth
								? "Keep it up! At this rate, you are on track to increase your wealth. Consider increasing your savings goal."
								: "Heads up! Your projected balance is trending downwards. You might want to review your recurring subscriptions or reduce discretionary spending."}
						</p>
						<div className="mt-4 space-y-2 text-xs text-muted-foreground 4xl:text-base">
							<p className="font-medium text-foreground">Quick tips:</p>
							<ul className="list-disc pl-4 space-y-1">
								<li>
									Automate a weekly transfer to savings right after payday.
								</li>
								<li>Cap dining and delivery at a fixed weekly amount.</li>
								<li>
									Review subscriptions monthly and cancel anything unused.
								</li>
							</ul>
						</div>
					</div>
				</GlassCard>

				<GlassCard>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Calendar className="h-5 w-5 text-emerald-400" />
							Upcoming Milestone
						</CardTitle>
					</CardHeader>
					<div className="p-6 pt-0">
						<div className="space-y-4">
							<div className="flex justify-between items-center text-sm 4xl:text-lg">
								<span>Projected End Balance:</span>
								<span className="font-bold text-foreground">
									{isPrivacyMode ? "****" : formatter.format(lastBalance || 0)}
								</span>
							</div>
							<div className="flex justify-between items-center text-sm 4xl:text-lg">
								<span>Projected Change:</span>
								<span
									className={`font-semibold ${projectedChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
									{isPrivacyMode
										? "****"
										: `${formatter.format(projectedChange)} (${projectedChangePct.toFixed(1)}%)`}
								</span>
							</div>
							<div className="flex justify-between items-center text-sm 4xl:text-lg">
								<span>Confidence Range:</span>
								<span className="font-semibold text-foreground">
									{typeof lastPoint?.low === "number" &&
									typeof lastPoint?.high === "number"
										? isPrivacyMode
											? "****"
											: `${formatter.format(lastPoint.low)} – ${formatter.format(lastPoint.high)}`
										: "--"}
								</span>
							</div>
							<div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
								<div className="bg-primary h-full w-[65%]" />
							</div>
							<p className="text-xs text-muted-foreground uppercase tracking-widest">
								Forecast Horizon: {months} months
							</p>
						</div>
					</div>
				</GlassCard>
			</div>
		</div>
	);
}
