"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Shield,
	Users,
	Lock,
	ShieldCheck,
	AlertTriangle,
	FileText,
	Landmark,
	Bitcoin,
	Building,
	Heart,
	HelpCircle,
	Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/PermissionGuard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import VaultEntryCard from "./VaultEntryCard";
import BeneficiaryManager from "./BeneficiaryManager";
import CreateVaultEntryDialog from "./CreateVaultEntryDialog";
import VaultOverview from "./VaultOverview";

interface VaultEntry {
	id: string;
	title: string;
	content: string;
	category: string;
	icon: string;
	sensitivity: string;
	notes: string | null;
	lastVerified: string | null;
	createdAt: string;
	updatedAt: string;
}

interface Beneficiary {
	id: string;
	name: string;
	email: string;
	relationship: string;
	phone: string | null;
	notes: string | null;
	accessLevel: string;
	isVerified: boolean;
	createdAt: string;
}

const CATEGORY_CONFIG: Record<
	string,
	{ label: string; icon: React.ReactNode; color: string; gradient: string }
> = {
	insurance: {
		label: "Insurance",
		icon: <Shield className="h-4 w-4" />,
		color: "text-blue-500",
		gradient: "from-blue-500/10 to-blue-600/5",
	},
	legal: {
		label: "Legal",
		icon: <FileText className="h-4 w-4" />,
		color: "text-amber-500",
		gradient: "from-amber-500/10 to-amber-600/5",
	},
	crypto: {
		label: "Crypto",
		icon: <Bitcoin className="h-4 w-4" />,
		color: "text-orange-500",
		gradient: "from-orange-500/10 to-orange-600/5",
	},
	banking: {
		label: "Banking",
		icon: <Landmark className="h-4 w-4" />,
		color: "text-emerald-500",
		gradient: "from-emerald-500/10 to-emerald-600/5",
	},
	property: {
		label: "Property",
		icon: <Building className="h-4 w-4" />,
		color: "text-violet-500",
		gradient: "from-violet-500/10 to-violet-600/5",
	},
	medical: {
		label: "Medical",
		icon: <Heart className="h-4 w-4" />,
		color: "text-rose-500",
		gradient: "from-rose-500/10 to-rose-600/5",
	},
	other: {
		label: "Other",
		icon: <HelpCircle className="h-4 w-4" />,
		color: "text-slate-500",
		gradient: "from-slate-500/10 to-slate-600/5",
	},
};

const SENSITIVITY_CONFIG: Record<
	string,
	{ label: string; color: string; bgColor: string }
> = {
	low: {
		label: "Low",
		color: "text-emerald-600",
		bgColor: "bg-emerald-500/10",
	},
	medium: {
		label: "Medium",
		color: "text-amber-600",
		bgColor: "bg-amber-500/10",
	},
	high: { label: "High", color: "text-orange-600", bgColor: "bg-orange-500/10" },
	critical: {
		label: "Critical",
		color: "text-red-600",
		bgColor: "bg-red-500/10",
	},
};

export { CATEGORY_CONFIG, SENSITIVITY_CONFIG };
export type { VaultEntry, Beneficiary };

export default function VaultContent() {
	const [activeTab, setActiveTab] = useState("overview");
	const [categoryFilter, setCategoryFilter] = useState("all");

	const entriesQuery = useQuery<VaultEntry[]>({
		queryKey: ["vault-entries"],
		queryFn: () => fetch("/api/vault").then((res) => res.json()),
	});

	const beneficiariesQuery = useQuery<Beneficiary[]>({
		queryKey: ["vault-beneficiaries"],
		queryFn: () =>
			fetch("/api/vault/beneficiaries").then((res) => res.json()),
	});

	const entries = entriesQuery.data || [];
	const beneficiaries = beneficiariesQuery.data || [];

	const filteredEntries =
		categoryFilter === "all"
			? entries
			: entries.filter((e) => e.category === categoryFilter);

	const categoryCounts = entries.reduce(
		(acc, entry) => {
			acc[entry.category] = (acc[entry.category] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	return (
		<Tabs
			value={activeTab}
			onValueChange={setActiveTab}
			className="space-y-6"
		>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<TabsList className="grid w-full grid-cols-3 sm:w-auto sm:flex">
					<TabsTrigger
						value="overview"
						className="gap-2 3xl:text-base"
					>
						<ShieldCheck className="h-4 w-4" />
						Overview
					</TabsTrigger>
					<TabsTrigger value="vault" className="gap-2 3xl:text-base">
						<Lock className="h-4 w-4" />
						Vault
					</TabsTrigger>
					<TabsTrigger
						value="beneficiaries"
						className="gap-2 3xl:text-base"
					>
						<Users className="h-4 w-4" />
						Beneficiaries
					</TabsTrigger>
				</TabsList>

				{activeTab === "vault" && (
					<PermissionGuard>
						<CreateVaultEntryDialog
							trigger={
								<Button className="gap-2 3xl:text-base">
									<Plus className="h-4 w-4 3xl:h-5 3xl:w-5" />
									Add Entry
								</Button>
							}
						/>
					</PermissionGuard>
				)}
			</div>

			{/* Overview Tab */}
			<TabsContent value="overview" className="space-y-6">
				<SkeletonWrapper
					isLoading={
						entriesQuery.isFetching ||
						beneficiariesQuery.isFetching
					}
				>
					<VaultOverview
						entries={entries}
						beneficiaries={beneficiaries}
						categoryCounts={categoryCounts}
						onNavigate={setActiveTab}
					/>
				</SkeletonWrapper>
			</TabsContent>

			{/* Vault Entries Tab */}
			<TabsContent value="vault" className="space-y-6">
				{/* Category Filter */}
				<div className="flex flex-wrap gap-2">
					<Button
						variant={
							categoryFilter === "all" ? "default" : "outline"
						}
						size="sm"
						onClick={() => setCategoryFilter("all")}
						className="gap-1.5 3xl:text-base"
					>
						All
						<span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
							{entries.length}
						</span>
					</Button>
					{Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
						const count = categoryCounts[key] || 0;
						if (count === 0) return null;
						return (
							<Button
								key={key}
								variant={
									categoryFilter === key
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => setCategoryFilter(key)}
								className="gap-1.5 3xl:text-base"
							>
								{config.icon}
								{config.label}
								<span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
									{count}
								</span>
							</Button>
						);
					})}
				</div>

				<SkeletonWrapper isLoading={entriesQuery.isFetching}>
					{filteredEntries.length === 0 ? (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex h-60 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border p-8"
						>
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
								<Lock className="h-8 w-8 text-muted-foreground" />
							</div>
							<div className="text-center">
								<p className="text-lg font-semibold 3xl:text-xl">
									No vault entries yet
								</p>
								<p className="text-sm text-muted-foreground 3xl:text-base">
									Add your first entry to start securing your
									legacy information
								</p>
							</div>
							<PermissionGuard>
								<CreateVaultEntryDialog
									trigger={
										<Button
											variant="outline"
											className="gap-2 mt-2"
										>
											<Plus className="h-4 w-4" />
											Create First Entry
										</Button>
									}
								/>
							</PermissionGuard>
						</motion.div>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 3xl:gap-6">
							<AnimatePresence>
								{filteredEntries.map((entry, index) => (
									<motion.div
										key={entry.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.95 }}
										transition={{
											delay: index * 0.05,
											duration: 0.3,
										}}
									>
										<VaultEntryCard entry={entry} />
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					)}
				</SkeletonWrapper>
			</TabsContent>

			{/* Beneficiaries Tab */}
			<TabsContent value="beneficiaries" className="space-y-6">
				<SkeletonWrapper isLoading={beneficiariesQuery.isFetching}>
					<BeneficiaryManager beneficiaries={beneficiaries} />
				</SkeletonWrapper>
			</TabsContent>
		</Tabs>
	);
}
