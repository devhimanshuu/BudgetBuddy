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
	DialogTrigger,
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
import { ReactNode, useState } from "react";
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

interface CreateVaultEntryDialogProps {
	trigger: ReactNode;
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

const CONTENT_TEMPLATES: Record<string, string> = {
	insurance:
		"Policy Number: \nProvider: \nType: (Life/Health/Property/Auto)\nCoverage Amount: \nPremium: \nBeneficiary: \nAgent Contact: \nRenewal Date: ",
	legal:
		"Document Type: \nLawyer Name: \nFirm: \nContact: \nLocation of Documents: \nKey Instructions: ",
	crypto:
		"Wallet Type: (Hardware/Software/Exchange)\nPlatform: \nApproximate Value: \nSeed Phrase Location: \nAccess Instructions: \n\n⚠️ NEVER store actual seed phrases directly. Store the LOCATION of the seed phrase.",
	banking:
		"Bank Name: \nAccount Type: (Checking/Savings/Investment)\nAccount Number: \nRouting Number: \nBranch: \nContact: \nOnline Access Info: ",
	property:
		"Property Address: \nType: (Residential/Commercial/Land)\nDeed Location: \nMortgage Provider: \nInsurance Policy: \nKey Location: ",
	medical:
		"Condition/Info Type: \nDoctor Name: \nHospital/Clinic: \nMedication: \nAllergies: \nBlood Type: \nEmergency Contact: ",
	other: "Title: \nDetails: \nLocation: \nAccess Instructions: ",
};

export default function CreateVaultEntryDialog({
	trigger,
}: CreateVaultEntryDialogProps) {
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [category, setCategory] = useState("other");
	const [sensitivity, setSensitivity] = useState("high");
	const [icon, setIcon] = useState(VAULT_ICONS[0]);
	const [notes, setNotes] = useState("");

	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: async (data: any) => {
			const response = await fetch("/api/vault", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error("Failed to create vault entry");
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("Vault entry created securely!");
			queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
			setOpen(false);
			resetForm();
		},
		onError: () => {
			toast.error("Failed to create vault entry");
		},
	});

	const resetForm = () => {
		setTitle("");
		setContent("");
		setCategory("other");
		setSensitivity("high");
		setIcon(VAULT_ICONS[0]);
		setNotes("");
	};

	const handleCategoryChange = (value: string) => {
		setCategory(value);
		// Auto-fill template if content is empty
		if (!content || content === CONTENT_TEMPLATES[category]) {
			setContent(CONTENT_TEMPLATES[value] || "");
		}
	};

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
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
							<Lock className="h-5 w-5" />
						</div>
						<div>
							<DialogTitle>Add Vault Entry</DialogTitle>
							<DialogDescription>
								Store sensitive information securely in your
								Legacy Vault
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="vault-title">
							Title <span className="text-red-500">*</span>
						</Label>
						<Input
							id="vault-title"
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
								onValueChange={handleCategoryChange}
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
						<Label htmlFor="vault-content">
							Content <span className="text-red-500">*</span>
						</Label>
						<Textarea
							id="vault-content"
							placeholder="Enter the secure information here..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={8}
							className="font-mono text-sm"
						/>
						<p className="text-xs text-muted-foreground">
							💡 Tip: Use the category-specific templates or
							enter custom information
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="vault-notes">
							Notes{" "}
							<span className="text-muted-foreground">
								(optional)
							</span>
						</Label>
						<Input
							id="vault-notes"
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
							{isPending ? "Securing..." : "Save to Vault"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
