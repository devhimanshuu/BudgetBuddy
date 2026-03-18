"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	Shield,
	Users,
	AlertTriangle,
	CheckCircle2,
	Clock,
	ArrowRight,
	Lock,
	ShieldAlert,
	Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { differenceInDays, format } from "date-fns";
import { CATEGORY_CONFIG, SENSITIVITY_CONFIG } from "./VaultContent";
import type { VaultEntry, Beneficiary } from "./VaultContent";

interface VaultOverviewProps {
	entries: VaultEntry[];
	beneficiaries: Beneficiary[];
	categoryCounts: Record<string, number>;
	onNavigate: (tab: string) => void;
}

export default function VaultOverview({
	entries,
	beneficiaries,
	categoryCounts,
	onNavigate,
}: VaultOverviewProps) {
	// Compute vault health score
	const totalCategories = Object.keys(CATEGORY_CONFIG).length;
	const coveredCategories = Object.keys(categoryCounts).length;
	const hasBeneficiaries = beneficiaries.length > 0;
	const verifiedEntries = entries.filter((e) => e.lastVerified).length;
	const staleEntries = entries.filter((e) => {
		if (!e.lastVerified) return true;
		return differenceInDays(new Date(), new Date(e.lastVerified)) > 90;
	});

	const healthScore = Math.min(
		100,
		Math.round(
			(coveredCategories / totalCategories) * 40 +
				(hasBeneficiaries ? 25 : 0) +
				(entries.length > 0
					? ((entries.length - staleEntries.length) /
							Math.max(entries.length, 1)) *
						35
					: 0),
		),
	);

	const getHealthColor = (score: number) => {
		if (score >= 80) return "text-emerald-500";
		if (score >= 50) return "text-amber-500";
		return "text-red-500";
	};

	const getHealthGradient = (score: number) => {
		if (score >= 80) return "from-emerald-500 to-emerald-600";
		if (score >= 50) return "from-amber-500 to-amber-600";
		return "from-red-500 to-red-600";
	};

	const criticalEntries = entries.filter(
		(e) => e.sensitivity === "critical",
	).length;
	const highEntries = entries.filter(
		(e) => e.sensitivity === "high",
	).length;

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.08 },
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	};

	return (
		<motion.div
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			className="space-y-6 3xl:space-y-8"
		>
			{/* Hero Stats Row */}
			<div className="grid gap-4 md:grid-cols-3 3xl:gap-6">
				{/* Vault Health */}
				<motion.div variants={itemVariants}>
					<Card className="group relative overflow-hidden">
						<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
						<CardHeader className="pb-2 3xl:p-8 3xl:pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-medium text-muted-foreground 3xl:text-base">
									Vault Health
								</CardTitle>
								<Shield
									className={`h-5 w-5 3xl:h-6 3xl:w-6 ${getHealthColor(healthScore)}`}
								/>
							</div>
						</CardHeader>
						<CardContent className="3xl:p-8 3xl:pt-0">
							<div className="flex items-end gap-2">
								<span
									className={`text-4xl font-bold 3xl:text-5xl ${getHealthColor(healthScore)}`}
								>
									{healthScore}%
								</span>
							</div>
							<Progress
								value={healthScore}
								className="mt-3 h-2 3xl:h-3"
							/>
							<p className="mt-2 text-xs text-muted-foreground 3xl:text-sm">
								{healthScore >= 80
									? "Your vault is well maintained"
									: healthScore >= 50
										? "Consider adding more entries"
										: "Your vault needs attention"}
							</p>
						</CardContent>
					</Card>
				</motion.div>

				{/* Total Entries */}
				<motion.div variants={itemVariants}>
					<Card className="group relative overflow-hidden">
						<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
						<CardHeader className="pb-2 3xl:p-8 3xl:pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-medium text-muted-foreground 3xl:text-base">
									Vault Entries
								</CardTitle>
								<Lock className="h-5 w-5 text-blue-500 3xl:h-6 3xl:w-6" />
							</div>
						</CardHeader>
						<CardContent className="3xl:p-8 3xl:pt-0">
							<div className="flex items-end gap-3">
								<span className="text-4xl font-bold 3xl:text-5xl">
									{entries.length}
								</span>
								<div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground 3xl:text-sm">
									{criticalEntries > 0 && (
										<span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-red-600">
											<ShieldAlert className="h-3 w-3" />
											{criticalEntries} critical
										</span>
									)}
									{highEntries > 0 && (
										<span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-orange-600">
											{highEntries} high
										</span>
									)}
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="mt-2 -ml-2 gap-1 text-xs text-muted-foreground 3xl:text-sm"
								onClick={() => onNavigate("vault")}
							>
								View all entries
								<ArrowRight className="h-3 w-3" />
							</Button>
						</CardContent>
					</Card>
				</motion.div>

				{/* Beneficiaries */}
				<motion.div variants={itemVariants}>
					<Card className="group relative overflow-hidden">
						<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
						<CardHeader className="pb-2 3xl:p-8 3xl:pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-medium text-muted-foreground 3xl:text-base">
									Beneficiaries
								</CardTitle>
								<Users className="h-5 w-5 text-emerald-500 3xl:h-6 3xl:w-6" />
							</div>
						</CardHeader>
						<CardContent className="3xl:p-8 3xl:pt-0">
							<div className="flex items-end gap-2">
								<span className="text-4xl font-bold 3xl:text-5xl">
									{beneficiaries.length}
								</span>
								<span className="mb-1 text-sm text-muted-foreground 3xl:text-base">
									trusted people
								</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="mt-2 -ml-2 gap-1 text-xs text-muted-foreground 3xl:text-sm"
								onClick={() => onNavigate("beneficiaries")}
							>
								Manage beneficiaries
								<ArrowRight className="h-3 w-3" />
							</Button>
						</CardContent>
					</Card>
				</motion.div>
			</div>

			{/* Category Coverage */}
			<motion.div variants={itemVariants}>
				<Card>
					<CardHeader className="3xl:p-8">
						<div className="flex items-center gap-2 3xl:gap-3">
							<Sparkles className="h-5 w-5 text-violet-500 3xl:h-6 3xl:w-6" />
							<div>
								<CardTitle className="3xl:text-2xl">
									Category Coverage
								</CardTitle>
								<CardDescription className="3xl:text-base">
									Ensure all important areas of your life are
									documented
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="3xl:p-8 3xl:pt-0">
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 3xl:gap-4">
							{Object.entries(CATEGORY_CONFIG).map(
								([key, config]) => {
									const count = categoryCounts[key] || 0;
									const isCovered = count > 0;
									return (
										<div
											key={key}
											className={`flex items-center gap-3 rounded-xl border p-3 transition-all 3xl:p-4 ${
												isCovered
													? "border-border bg-gradient-to-br " +
														config.gradient
													: "border-dashed border-border/60 opacity-60"
											}`}
										>
											<div
												className={`flex h-9 w-9 items-center justify-center rounded-lg 3xl:h-10 3xl:w-10 ${
													isCovered
														? `bg-background/80 ${config.color}`
														: "bg-muted text-muted-foreground"
												}`}
											>
												{config.icon}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate 3xl:text-base">
													{config.label}
												</p>
												<p className="text-xs text-muted-foreground 3xl:text-sm">
													{isCovered
														? `${count} ${count === 1 ? "entry" : "entries"}`
														: "Not yet covered"}
												</p>
											</div>
											{isCovered ? (
												<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 3xl:h-5 3xl:w-5" />
											) : (
												<AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground 3xl:h-5 3xl:w-5" />
											)}
										</div>
									);
								},
							)}
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Action Items */}
			{(staleEntries.length > 0 ||
				!hasBeneficiaries ||
				coveredCategories < 3) && (
				<motion.div variants={itemVariants}>
					<Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
						<CardHeader className="3xl:p-8">
							<div className="flex items-center gap-2 3xl:gap-3">
								<AlertTriangle className="h-5 w-5 text-amber-500 3xl:h-6 3xl:w-6" />
								<div>
									<CardTitle className="3xl:text-2xl">
										Action Items
									</CardTitle>
									<CardDescription className="3xl:text-base">
										Improve your vault coverage
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="3xl:p-8 3xl:pt-0">
							<div className="space-y-3 3xl:space-y-4">
								{!hasBeneficiaries && (
									<div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-background p-3 3xl:p-4">
										<Users className="h-5 w-5 shrink-0 text-amber-500 3xl:h-6 3xl:w-6" />
										<div className="flex-1">
											<p className="text-sm font-medium 3xl:text-base">
												Add a beneficiary
											</p>
											<p className="text-xs text-muted-foreground 3xl:text-sm">
												Ensure someone you trust can
												access your vault in an
												emergency
											</p>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												onNavigate("beneficiaries")
											}
											className="3xl:text-base"
										>
											Add
										</Button>
									</div>
								)}
								{staleEntries.length > 0 && (
									<div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-background p-3 3xl:p-4">
										<Clock className="h-5 w-5 shrink-0 text-amber-500 3xl:h-6 3xl:w-6" />
										<div className="flex-1">
											<p className="text-sm font-medium 3xl:text-base">
												{staleEntries.length}{" "}
												{staleEntries.length === 1
													? "entry needs"
													: "entries need"}{" "}
												verification
											</p>
											<p className="text-xs text-muted-foreground 3xl:text-sm">
												Entries not verified in the last
												90 days
											</p>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												onNavigate("vault")
											}
											className="3xl:text-base"
										>
											Review
										</Button>
									</div>
								)}
								{coveredCategories < 3 && (
									<div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-background p-3 3xl:p-4">
										<Shield className="h-5 w-5 shrink-0 text-amber-500 3xl:h-6 3xl:w-6" />
										<div className="flex-1">
											<p className="text-sm font-medium 3xl:text-base">
												Cover more categories
											</p>
											<p className="text-xs text-muted-foreground 3xl:text-sm">
												Only {coveredCategories} of{" "}
												{totalCategories} categories
												documented
											</p>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												onNavigate("vault")
											}
											className="3xl:text-base"
										>
											Add
										</Button>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</motion.div>
			)}
		</motion.div>
	);
}
