"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
	Eye,
	EyeOff,
	MoreVertical,
	Trash2,
	CheckCircle2,
	Clock,
	AlertTriangle,
	ShieldCheck,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { PermissionGuard } from "@/components/PermissionGuard";
import {
	CATEGORY_CONFIG,
	SENSITIVITY_CONFIG,
} from "./VaultContent";
import type { VaultEntry } from "./VaultContent";

interface VaultEntryCardProps {
	entry: VaultEntry;
}

export default function VaultEntryCard({ entry }: VaultEntryCardProps) {
	const [isRevealed, setIsRevealed] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const queryClient = useQueryClient();

	const categoryConfig = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.other;
	const sensitivityConfig =
		SENSITIVITY_CONFIG[entry.sensitivity] || SENSITIVITY_CONFIG.high;

	const isStale = (() => {
		if (!entry.lastVerified) return true;
		return differenceInDays(new Date(), new Date(entry.lastVerified)) > 90;
	})();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(`/api/vault?id=${entry.id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error("Failed to delete entry");
			return response.json();
		},
		onSuccess: () => {
			toast.success("Vault entry deleted");
			queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
		},
		onError: () => {
			toast.error("Failed to delete entry");
		},
	});

	const verifyMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch("/api/vault", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: entry.id,
					lastVerified: new Date().toISOString(),
				}),
			});
			if (!response.ok) throw new Error("Failed to verify entry");
			return response.json();
		},
		onSuccess: () => {
			toast.success("Entry verified as up-to-date");
			queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
		},
		onError: () => {
			toast.error("Failed to verify entry");
		},
	});

	return (
		<>
			<Card
				className={cn(
					"group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
					isStale && "border-amber-500/30",
				)}
			>
				{/* Left color accent */}
				<div
					className={cn(
						"absolute left-0 top-0 h-full w-1 transition-all duration-300",
						entry.sensitivity === "critical"
							? "bg-red-500"
							: entry.sensitivity === "high"
								? "bg-orange-500"
								: entry.sensitivity === "medium"
									? "bg-amber-500"
									: "bg-emerald-500",
					)}
				/>

				{/* Hover gradient */}
				<div
					className={cn(
						"pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
						categoryConfig.gradient,
					)}
				/>

				<CardHeader className="relative z-10 pb-2 3xl:pb-3">
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-center gap-2.5 min-w-0 3xl:gap-3">
							<span className="text-2xl shrink-0 3xl:text-3xl">
								{entry.icon}
							</span>
							<div className="min-w-0">
								<CardTitle className="text-base truncate 3xl:text-lg">
									{entry.title}
								</CardTitle>
								<div className="flex items-center gap-2 mt-1 flex-wrap">
									<Badge
										variant="secondary"
										className={cn(
											"text-xs gap-1 3xl:text-sm",
											categoryConfig.color,
										)}
									>
										{categoryConfig.icon}
										{categoryConfig.label}
									</Badge>
									<Badge
										variant="secondary"
										className={cn(
											"text-xs 3xl:text-sm",
											sensitivityConfig.color,
											sensitivityConfig.bgColor,
										)}
									>
										{sensitivityConfig.label}
									</Badge>
								</div>
							</div>
						</div>

						<PermissionGuard>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 shrink-0"
									>
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() =>
											verifyMutation.mutate()
										}
										className="gap-2"
									>
										<ShieldCheck className="h-4 w-4" />
										Mark as Verified
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() =>
											setDeleteDialogOpen(true)
										}
										className="gap-2 text-red-600 focus:text-red-600"
									>
										<Trash2 className="h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</PermissionGuard>
					</div>
				</CardHeader>

				<CardContent className="relative z-10 space-y-3 3xl:space-y-4">
					{/* Content area (masked/revealed) */}
					<div
						className={cn(
							"relative rounded-lg border bg-muted/50 p-3 transition-all 3xl:p-4",
							!isRevealed && "select-none",
						)}
					>
						{isRevealed ? (
							<p className="text-sm whitespace-pre-wrap break-words 3xl:text-base">
								{entry.content}
							</p>
						) : (
							<div className="flex flex-col items-center gap-2 py-2">
								<div className="flex items-center gap-1.5 text-sm text-muted-foreground 3xl:text-base">
									<EyeOff className="h-4 w-4 3xl:h-5 3xl:w-5" />
									Content hidden
								</div>
								<p className="text-xs text-muted-foreground/70 3xl:text-sm">
									Click reveal to view sensitive information
								</p>
							</div>
						)}
					</div>

					{/* Reveal toggle */}
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsRevealed(!isRevealed)}
						className="w-full gap-2 3xl:text-base"
					>
						{isRevealed ? (
							<>
								<EyeOff className="h-4 w-4 3xl:h-5 3xl:w-5" />{" "}
								Hide Content
							</>
						) : (
							<>
								<Eye className="h-4 w-4 3xl:h-5 3xl:w-5" />{" "}
								Reveal Content
							</>
						)}
					</Button>

					{/* Notes */}
					{entry.notes && (
						<p className="text-xs text-muted-foreground italic 3xl:text-sm">
							📝 {entry.notes}
						</p>
					)}

					{/* Footer info */}
					<div className="flex items-center justify-between text-xs text-muted-foreground pt-1 3xl:text-sm">
						<span className="flex items-center gap-1">
							<Clock className="h-3 w-3 3xl:h-4 3xl:w-4" />
							Updated{" "}
							{format(new Date(entry.updatedAt), "MMM d, yyyy")}
						</span>
						{entry.lastVerified ? (
							<span
								className={cn(
									"flex items-center gap-1",
									isStale
										? "text-amber-600"
										: "text-emerald-600",
								)}
							>
								{isStale ? (
									<AlertTriangle className="h-3 w-3 3xl:h-4 3xl:w-4" />
								) : (
									<CheckCircle2 className="h-3 w-3 3xl:h-4 3xl:w-4" />
								)}
								{isStale ? "Needs review" : "Verified"}
							</span>
						) : (
							<span className="flex items-center gap-1 text-amber-600">
								<AlertTriangle className="h-3 w-3 3xl:h-4 3xl:w-4" />
								Unverified
							</span>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<div className="flex items-center gap-3">
							<div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
								<AlertTriangle className="h-6 w-6 text-red-600" />
							</div>
							<div>
								<AlertDialogTitle>
									Delete Vault Entry
								</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to permanently delete
									this entry?
								</AlertDialogDescription>
							</div>
						</div>
					</AlertDialogHeader>
					<div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
						<div className="flex items-center gap-3">
							<span className="text-2xl">{entry.icon}</span>
							<div>
								<p className="font-semibold text-red-900 dark:text-red-100">
									{entry.title}
								</p>
								<p className="text-sm text-red-700 dark:text-red-300">
									{categoryConfig.label} •{" "}
									{sensitivityConfig.label} sensitivity
								</p>
							</div>
						</div>
					</div>
					<AlertDialogDescription className="text-muted-foreground">
						This action cannot be undone. This will permanently
						delete the vault entry and all associated data.
					</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutation.mutate()}
							className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
						>
							Delete Entry
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
