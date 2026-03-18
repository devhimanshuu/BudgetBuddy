"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	Shield,
	FileText,
	Bitcoin,
	Landmark,
	Building,
	Heart,
	HelpCircle,
	Lock,
} from "lucide-react";
import type { VaultEntry } from "./VaultContent";

interface EditVaultEntryDialogProps {
	entry: VaultEntry;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const VAULT_ICONS = ["🔒", "🏛️", "📋", "💳", "🏠", "⚕️", "₿", "📂", "🔑", "💼"];

const CATEGORIES = [
	{
		value: "insurance",
		label: "Insurance",
		icon: <Shield className="h-4 w-4" />,
	},
	{
		value: "legal",
		label: "Legal",
		icon: <FileText className="h-4 w-4" />,
	},
	{
		value: "crypto",
		label: "Crypto",
		icon: <Bitcoin className="h-4 w-4" />,
	},
	{
		value: "banking",
		label: "Banking",
		icon: <Landmark className="h-4 w-4" />,
	},
	{
		value: "property",
		label: "Property",
		icon: <Building className="h-4 w-4" />,
	},
	{
		value: "medical",
		label: "Medical",
		icon: <Heart className="h-4 w-4" />,
	},
	{
		value: "other",
		label: "Other",
		icon: <HelpCircle className="h-4 w-4" />,
	},
];

const SENSITIVITY_LEVELS = [
	{
		value: "low",
		label: "Low",
		description: "General info",
		color: "text-emerald-600",
	},
	{
		value: "medium",
		label: "Medium",
		description: "Important details",
		color: "text-amber-600",
	},
	{
		value: "high",
		label: "High",
		description: "Confidential",
		color: "text-orange-600",
	},
	{
		value: "critical",
		label: "Critical",
		description: "Top secret",
		color: "text-red-600",
	},
];

export default function EditVaultEntryDialog({
	entry,
	open,
	onOpenChange,
}: EditVaultEntryDialogProps) {
	const [title, setTitle] = useState(entry.title);
	const [content, setContent] = useState(entry.content);
	const [category, setCategory] = useState(entry.category);
	const [sensitivity, setSensitivity] = useState(entry.sensitivity);
	const [icon, setIcon] = useState(entry.icon);
	const [notes, setNotes] = useState(entry.notes || "");

	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: async (data: any) => {
			const response = await fetch("/api/vault", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...data, id: entry.id }),
			});

			if (!response.ok) {
				throw new Error("Failed to update vault entry");
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("Vault entry updated successfully!");
			queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
			onOpenChange(false);
		},
		onError: () => {
			toast.error("Failed to update vault entry");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!title || !content) {
			toast.error("Please fill in the title and content");
			return;
		}

		mutate({
			title,
			content,
			category,
			sensitivity,
			icon,
			notes: notes || undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
							<Lock className="h-5 w-5" />
						</div>
						<div>
							<DialogTitle>Edit Vault Entry</DialogTitle>
							<DialogDescription>
								Update your sensitive information securely.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="vault-title-edit">
							Title <span className="text-red-500">*</span>
						</Label>
						<Input
							id="vault-title-edit"
							placeholder="e.g., Life Insurance Policy, Crypto Wallet Access"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							maxLength={200}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Category</Label>
							<Select
								value={category}
								onValueChange={setCategory}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{CATEGORIES.map((cat) => (
										<SelectItem
											key={cat.value}
											value={cat.value}
										>
											<div className="flex items-center gap-2">
												{cat.icon}
												{cat.label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Sensitivity Level</Label>
							<Select
								value={sensitivity}
								onValueChange={setSensitivity}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select level" />
								</SelectTrigger>
								<SelectContent>
									{SENSITIVITY_LEVELS.map((level) => (
										<SelectItem
											key={level.value}
											value={level.value}
										>
											<div className="flex items-center gap-2">
												<span
													className={level.color}
												>
													●
												</span>
												<span>{level.label}</span>
												<span className="text-xs text-muted-foreground">
													– {level.description}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="vault-content-edit">
							Content <span className="text-red-500">*</span>
						</Label>
						<Textarea
							id="vault-content-edit"
							placeholder="Enter the secure information here..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={8}
							className="font-mono text-sm"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="vault-notes-edit">
							Notes{" "}
							<span className="text-muted-foreground">
								(optional)
							</span>
						</Label>
						<Input
							id="vault-notes-edit"
							placeholder="Additional context or reminders..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label>Icon</Label>
						<div className="flex flex-wrap gap-2">
							{VAULT_ICONS.map((vaultIcon) => (
								<button
									key={vaultIcon}
									type="button"
									className={`flex h-10 w-10 items-center justify-center rounded-md border-2 text-xl transition-all ${
										icon === vaultIcon
											? "scale-110 border-primary"
											: "border-transparent hover:border-muted-foreground"
									}`}
									onClick={() => setIcon(vaultIcon)}
								>
									{vaultIcon}
								</button>
							))}
						</div>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</DialogClose>
						<Button
							type="submit"
							disabled={isPending}
							className="gap-2"
						>
							<Lock className="h-4 w-4" />
							{isPending ? "Updating..." : "Update Vault Entry"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
