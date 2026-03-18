"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Users,
	Plus,
	Mail,
	Phone,
	Trash2,
	AlertTriangle,
	UserCircle,
	ShieldCheck,
	Shield,
	ShieldAlert,
	Heart,
	Briefcase,
	GraduationCap,
	User,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/PermissionGuard";
import { format } from "date-fns";
import type { Beneficiary } from "./VaultContent";

interface BeneficiaryManagerProps {
	beneficiaries: Beneficiary[];
}

const RELATIONSHIP_CONFIG: Record<
	string,
	{ label: string; icon: React.ReactNode; color: string }
> = {
	spouse: {
		label: "Spouse",
		icon: <Heart className="h-4 w-4" />,
		color: "text-rose-500",
	},
	child: {
		label: "Child",
		icon: <User className="h-4 w-4" />,
		color: "text-blue-500",
	},
	parent: {
		label: "Parent",
		icon: <UserCircle className="h-4 w-4" />,
		color: "text-violet-500",
	},
	sibling: {
		label: "Sibling",
		icon: <Users className="h-4 w-4" />,
		color: "text-teal-500",
	},
	lawyer: {
		label: "Lawyer",
		icon: <Briefcase className="h-4 w-4" />,
		color: "text-amber-500",
	},
	accountant: {
		label: "Accountant",
		icon: <GraduationCap className="h-4 w-4" />,
		color: "text-emerald-500",
	},
	other: {
		label: "Other",
		icon: <User className="h-4 w-4" />,
		color: "text-slate-500",
	},
};

const ACCESS_LEVEL_CONFIG: Record<
	string,
	{ label: string; icon: React.ReactNode; color: string; description: string }
> = {
	full: {
		label: "Full Access",
		icon: <ShieldCheck className="h-3.5 w-3.5" />,
		color: "text-emerald-600",
		description: "Can view all vault entries",
	},
	partial: {
		label: "Partial Access",
		icon: <Shield className="h-3.5 w-3.5" />,
		color: "text-amber-600",
		description: "Can view non-critical entries",
	},
	"emergency-only": {
		label: "Emergency Only",
		icon: <ShieldAlert className="h-3.5 w-3.5" />,
		color: "text-red-600",
		description: "Only in emergency situations",
	},
};

export default function BeneficiaryManager({
	beneficiaries,
}: BeneficiaryManagerProps) {
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [toDelete, setToDelete] = useState<Beneficiary | null>(null);

	// Form state
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [relationship, setRelationship] = useState("other");
	const [phone, setPhone] = useState("");
	const [notes, setNotes] = useState("");
	const [accessLevel, setAccessLevel] = useState("full");

	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: async (data: any) => {
			const response = await fetch("/api/vault/beneficiaries", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Failed to add beneficiary");
			return response.json();
		},
		onSuccess: () => {
			toast.success("Beneficiary added successfully");
			queryClient.invalidateQueries({
				queryKey: ["vault-beneficiaries"],
			});
			setAddDialogOpen(false);
			resetForm();
		},
		onError: () => {
			toast.error("Failed to add beneficiary");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const response = await fetch(
				`/api/vault/beneficiaries?id=${id}`,
				{
					method: "DELETE",
				},
			);
			if (!response.ok) throw new Error("Failed to remove beneficiary");
			return response.json();
		},
		onSuccess: () => {
			toast.success("Beneficiary removed");
			queryClient.invalidateQueries({
				queryKey: ["vault-beneficiaries"],
			});
			setDeleteDialogOpen(false);
			setToDelete(null);
		},
		onError: () => {
			toast.error("Failed to remove beneficiary");
		},
	});

	const resetForm = () => {
		setName("");
		setEmail("");
		setRelationship("other");
		setPhone("");
		setNotes("");
		setAccessLevel("full");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name || !email) {
			toast.error("Name and email are required");
			return;
		}
		createMutation.mutate({
			name,
			email,
			relationship,
			phone: phone || undefined,
			notes: notes || undefined,
			accessLevel,
		});
	};

	return (
		<>
			<Card>
				<CardHeader className="3xl:p-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 3xl:gap-3">
							<Users className="h-6 w-6 text-emerald-500 3xl:h-8 3xl:w-8" />
							<div>
								<CardTitle className="3xl:text-2xl">
									Beneficiaries
								</CardTitle>
								<CardDescription className="3xl:text-base">
									People you trust to access your vault in an
									emergency
								</CardDescription>
							</div>
						</div>
						<PermissionGuard>
							<Dialog
								open={addDialogOpen}
								onOpenChange={setAddDialogOpen}
							>
								<DialogTrigger asChild>
									<Button className="gap-2 3xl:text-base">
										<Plus className="h-4 w-4 3xl:h-5 3xl:w-5" />
										Add Beneficiary
									</Button>
								</DialogTrigger>
								<DialogContent className="max-h-[90vh] overflow-y-auto">
									<DialogHeader>
										<DialogTitle>
											Add Beneficiary
										</DialogTitle>
										<DialogDescription>
											Add a trusted person who can access
											your vault information
										</DialogDescription>
									</DialogHeader>

									<form
										onSubmit={handleSubmit}
										className="space-y-4"
									>
										<div className="space-y-2">
											<Label htmlFor="ben-name">
												Full Name{" "}
												<span className="text-red-500">
													*
												</span>
											</Label>
											<Input
												id="ben-name"
												placeholder="e.g., Jane Doe"
												value={name}
												onChange={(e) =>
													setName(e.target.value)
												}
												maxLength={100}
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="ben-email">
												Email{" "}
												<span className="text-red-500">
													*
												</span>
											</Label>
											<Input
												id="ben-email"
												type="email"
												placeholder="jane@example.com"
												value={email}
												onChange={(e) =>
													setEmail(e.target.value)
												}
											/>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>Relationship</Label>
												<Select
													value={relationship}
													onValueChange={
														setRelationship
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select" />
													</SelectTrigger>
													<SelectContent>
														{Object.entries(
															RELATIONSHIP_CONFIG,
														).map(
															([
																key,
																config,
															]) => (
																<SelectItem
																	key={key}
																	value={key}
																>
																	<div className="flex items-center gap-2">
																		{
																			config.icon
																		}
																		{
																			config.label
																		}
																	</div>
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<Label>Access Level</Label>
												<Select
													value={accessLevel}
													onValueChange={
														setAccessLevel
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select" />
													</SelectTrigger>
													<SelectContent>
														{Object.entries(
															ACCESS_LEVEL_CONFIG,
														).map(
															([
																key,
																config,
															]) => (
																<SelectItem
																	key={key}
																	value={key}
																>
																	<div className="flex items-center gap-2">
																		<span
																			className={
																				config.color
																			}
																		>
																			{
																				config.icon
																			}
																		</span>
																		{
																			config.label
																		}
																	</div>
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="ben-phone">
												Phone{" "}
												<span className="text-muted-foreground">
													(optional)
												</span>
											</Label>
											<Input
												id="ben-phone"
												type="tel"
												placeholder="+1 (555) 000-0000"
												value={phone}
												onChange={(e) =>
													setPhone(e.target.value)
												}
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="ben-notes">
												Notes{" "}
												<span className="text-muted-foreground">
													(optional)
												</span>
											</Label>
											<Input
												id="ben-notes"
												placeholder="Additional context..."
												value={notes}
												onChange={(e) =>
													setNotes(e.target.value)
												}
											/>
										</div>

										<DialogFooter>
											<DialogClose asChild>
												<Button
													type="button"
													variant="outline"
												>
													Cancel
												</Button>
											</DialogClose>
											<Button
												type="submit"
												disabled={
													createMutation.isPending
												}
											>
												{createMutation.isPending
													? "Adding..."
													: "Add Beneficiary"}
											</Button>
										</DialogFooter>
									</form>
								</DialogContent>
							</Dialog>
						</PermissionGuard>
					</div>
				</CardHeader>
				<CardContent className="3xl:p-8 3xl:pt-0">
					{beneficiaries.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground 3xl:text-lg">
							<Users className="h-10 w-10 opacity-50" />
							<div className="text-center">
								<p className="font-medium">
									No beneficiaries added yet
								</p>
								<p className="text-sm">
									Add trusted people who can access your vault
								</p>
							</div>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 3xl:gap-6">
							<AnimatePresence>
								{beneficiaries.map((b, index) => {
									const relConfig =
										RELATIONSHIP_CONFIG[b.relationship] ||
										RELATIONSHIP_CONFIG.other;
									const accessConfig =
										ACCESS_LEVEL_CONFIG[b.accessLevel] ||
										ACCESS_LEVEL_CONFIG.full;

									return (
										<motion.div
											key={b.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{
												opacity: 0,
												scale: 0.95,
											}}
											transition={{
												delay: index * 0.05,
											}}
										>
											<Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
												{/* Accent */}
												<div
													className={cn(
														"absolute left-0 top-0 h-full w-1",
														b.accessLevel ===
															"full"
															? "bg-emerald-500"
															: b.accessLevel ===
																	"partial"
																? "bg-amber-500"
																: "bg-red-500",
													)}
												/>

												<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

												<CardContent className="relative z-10 p-4 3xl:p-6">
													<div className="flex items-start justify-between gap-2">
														<div className="flex items-center gap-3 min-w-0">
															<div
																className={cn(
																	"flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted 3xl:h-12 3xl:w-12",
																	relConfig.color,
																)}
															>
																{relConfig.icon}
															</div>
															<div className="min-w-0">
																<p className="font-semibold truncate 3xl:text-lg">
																	{b.name}
																</p>
																<Badge
																	variant="secondary"
																	className={cn(
																		"mt-0.5 text-xs 3xl:text-sm",
																		relConfig.color,
																	)}
																>
																	{
																		relConfig.label
																	}
																</Badge>
															</div>
														</div>
														<PermissionGuard>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-600"
																onClick={() => {
																	setToDelete(
																		b,
																	);
																	setDeleteDialogOpen(
																		true,
																	);
																}}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</PermissionGuard>
													</div>

													<div className="mt-3 space-y-2 3xl:mt-4 3xl:space-y-3">
														<div className="flex items-center gap-2 text-sm text-muted-foreground 3xl:text-base">
															<Mail className="h-3.5 w-3.5 shrink-0 3xl:h-4 3xl:w-4" />
															<span className="truncate">
																{b.email}
															</span>
														</div>
														{b.phone && (
															<div className="flex items-center gap-2 text-sm text-muted-foreground 3xl:text-base">
																<Phone className="h-3.5 w-3.5 shrink-0 3xl:h-4 3xl:w-4" />
																<span>
																	{b.phone}
																</span>
															</div>
														)}
													</div>

													<div className="mt-3 flex items-center justify-between 3xl:mt-4">
														<div
															className={cn(
																"flex items-center gap-1.5 text-xs 3xl:text-sm",
																accessConfig.color,
															)}
														>
															{accessConfig.icon}
															{
																accessConfig.label
															}
														</div>
														<span className="text-xs text-muted-foreground 3xl:text-sm">
															Added{" "}
															{format(
																new Date(
																	b.createdAt,
																),
																"MMM d, yyyy",
															)}
														</span>
													</div>

													{b.notes && (
														<p className="mt-2 text-xs text-muted-foreground italic 3xl:text-sm">
															{b.notes}
														</p>
													)}
												</CardContent>
											</Card>
										</motion.div>
									);
								})}
							</AnimatePresence>
						</div>
					)}
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
									Remove Beneficiary
								</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to remove this
									beneficiary?
								</AlertDialogDescription>
							</div>
						</div>
					</AlertDialogHeader>
					{toDelete && (
						<div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
							<div className="flex items-center gap-3">
								<div
									className={cn(
										"flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30",
										RELATIONSHIP_CONFIG[
											toDelete.relationship
										]?.color,
									)}
								>
									{
										RELATIONSHIP_CONFIG[
											toDelete.relationship
										]?.icon
									}
								</div>
								<div>
									<p className="font-semibold text-red-900 dark:text-red-100">
										{toDelete.name}
									</p>
									<p className="text-sm text-red-700 dark:text-red-300">
										{toDelete.email}
									</p>
								</div>
							</div>
						</div>
					)}
					<AlertDialogDescription className="text-muted-foreground">
						This person will no longer be listed as a beneficiary
						for your vault.
					</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								toDelete && deleteMutation.mutate(toDelete.id)
							}
							className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
						>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
