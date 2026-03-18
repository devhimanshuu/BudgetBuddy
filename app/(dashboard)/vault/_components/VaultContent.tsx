"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	Shield,
	FileText,
	Bitcoin,
	Landmark,
	Building,
	Heart,
	HelpCircle,
	Lock,
	Users,
	ShieldCheck,
	ArrowUpDown,
	Search,
	Activity,
	FileDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PermissionGuard } from "@/components/PermissionGuard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import VaultEntryCard from "./VaultEntryCard";
import BeneficiaryManager from "./BeneficiaryManager";
import CreateVaultEntryDialog from "./CreateVaultEntryDialog";
import VaultOverview from "./VaultOverview";
import DMSManager from "./DMSManager";
import VaultPrintView from "./VaultPrintView";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VaultEntry {
	id: string;
	userId: string;
	workspaceId: string | null;
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
	const { user } = useUser();
	const [activeTab, setActiveTab] = useState("overview");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("newest");

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

	const filteredEntries = entries
		.filter((e) => {
			const isCategory =
				categoryFilter === "all" || e.category === categoryFilter;
			const isSearch =
				e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				e.content.toLowerCase().includes(searchQuery.toLowerCase());
			return isCategory && isSearch;
		})
		.sort((a, b) => {
			if (sortBy === "newest")
				return (
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime()
				);
			if (sortBy === "oldest")
				return (
					new Date(a.createdAt).getTime() -
					new Date(b.createdAt).getTime()
				);
			if (sortBy === "title") return a.title.localeCompare(b.title);
			if (sortBy === "sensitivity") {
				const order: Record<string, number> = {
					critical: 4,
					high: 3,
					medium: 2,
					low: 1,
				};
				return (order[b.sensitivity] || 0) - (order[a.sensitivity] || 0);
			}
			return 0;
		});

	const categoryCounts = entries.reduce(
		(acc, entry) => {
			acc[entry.category] = (acc[entry.category] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	const handleExport = () => {
		toast.info("Preparing your secure vault summary...");
		setTimeout(() => {
			window.print();
		}, 500);
	};

	return (
		<Tabs
			value={activeTab}
			onValueChange={setActiveTab}
			className="space-y-6"
		>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<TabsList className="grid w-full grid-cols-4 sm:w-auto sm:flex">
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
					<TabsTrigger
						value="inheritance"
						className="gap-2 3xl:text-base"
					>
						<Activity className="h-4 w-4" />
						Inheritance
					</TabsTrigger>
				</TabsList>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="gap-2 h-9 3xl:h-12 3xl:text-base"
						onClick={handleExport}
					>
						<FileDown className="h-4 w-4" />
						Export Secure PDF
					</Button>
					<PermissionGuard>
						<CreateVaultEntryDialog
							trigger={
								<Button className="gap-2 h-9 3xl:h-12 3xl:text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 transition-all active:scale-95 group">
									<Lock className="h-4 w-4 group-hover:rotate-12 transition-transform" />
									Add New Entry
								</Button>
							}
						/>
					</PermissionGuard>
				</div>
			</div>

			{/* Overview Tab */}
			<TabsContent value="overview" className="space-y-6">
				<SkeletonWrapper isLoading={entriesQuery.isFetching}>
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
				<div className="flex flex-wrap gap-2">
					<Button
						variant={categoryFilter === "all" ? "default" : "outline"}
						size="sm"
						onClick={() => setCategoryFilter("all")}
						className="rounded-full 3xl:text-base 3xl:h-11"
					>
						All Entries
						<Badge
							variant="secondary"
							className="ml-2 bg-white/20 text-white"
						>
							{entries.length}
						</Badge>
					</Button>
					{Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
						const count = categoryCounts[key] || 0;
						if (count === 0) return null;

						return (
							<Button
								key={key}
								variant={
									categoryFilter === key ? "default" : "outline"
								}
								size="sm"
								onClick={() => setCategoryFilter(key)}
								className="rounded-full gap-2 3xl:text-base 3xl:h-11"
							>
								{config.icon}
								{config.label}
								<Badge variant="secondary" className="ml-1">
									{count}
								</Badge>
							</Button>
						);
					})}
				</div>

				{/* Search & Sort Bar */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search in vault..."
							className="pl-8 3xl:text-base 3xl:h-11 shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<ArrowUpDown className="h-4 w-4 text-muted-foreground" />
						<Select value={sortBy} onValueChange={setSortBy}>
							<SelectTrigger className="w-[140px] 3xl:w-[180px] 3xl:h-11 3xl:text-base shadow-sm">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="newest">Newest</SelectItem>
								<SelectItem value="oldest">Oldest</SelectItem>
								<SelectItem value="title">Title (A-Z)</SelectItem>
								<SelectItem value="sensitivity">Sensitivity</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<SkeletonWrapper isLoading={entriesQuery.isFetching}>
					{filteredEntries.length === 0 ? (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted p-12 text-center"
						>
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground mb-4">
								<Lock className="h-8 w-8" />
							</div>
							<h3 className="text-xl font-bold">No entries found</h3>
							<p className="text-muted-foreground max-w-xs mx-auto">
								{searchQuery
									? `No results for "${searchQuery}" in this category.`
									: "Start securing your digital heritage by adding your first vault entry."}
							</p>
							{!searchQuery && (
								<div className="mt-6">
									<CreateVaultEntryDialog
										trigger={
											<Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600">
												<Lock className="h-4 w-4" />
												Create your first entry
											</Button>
										}
									/>
								</div>
							)}
						</motion.div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
							<AnimatePresence mode="popLayout">
								{filteredEntries.map((entry) => (
									<VaultEntryCard key={entry.id} entry={entry} />
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

			{/* Inheritance Tab */}
			<TabsContent value="inheritance" className="space-y-6">
				<DMSManager />
			</TabsContent>

			{/* Hidden Print View */}
			<VaultPrintView
				entries={entries}
				userName={user?.fullName || "BudgetBuddy User"}
			/>
		</Tabs>
	);
}

function Badge({
	children,
	className,
	variant = "default",
}: {
	children: React.ReactNode;
	className?: string;
	variant?: "default" | "secondary";
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
				variant === "default" && "bg-primary text-primary-foreground",
				variant === "secondary" && "bg-secondary text-secondary-foreground",
				className,
			)}
		>
			{children}
		</span>
	);
}
