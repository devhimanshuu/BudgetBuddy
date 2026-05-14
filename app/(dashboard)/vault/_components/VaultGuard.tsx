"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import VaultPINOverlay from "./VaultPINOverlay";
import VaultPINSetup from "./VaultPINSetup";
import { Lock, Unlock, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/PermissionGuard";
import { toast } from "sonner";
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

interface PINStatus {
	isEnabled: boolean;
	isSet: boolean;
}

type GuardState = "loading" | "setup-prompt" | "locked" | "unlocked" | "setting-up";

interface VaultGuardProps {
	children: React.ReactNode;
}

export default function VaultGuard({ children }: VaultGuardProps) {
	const [guardState, setGuardState] = useState<GuardState>("loading");
	const [showDisableConfirm, setShowDisableConfirm] = useState(false);
	const [showChangePin, setShowChangePin] = useState(false);
	const queryClient = useQueryClient();

	const pinStatusQuery = useQuery<PINStatus>({
		queryKey: ["vault-pin-status"],
		queryFn: () => fetch("/api/vault/pin").then((res) => res.json()),
	});

	// Decide initial guard state based on PIN status
	useEffect(() => {
		if (pinStatusQuery.isLoading) return;
		const status = pinStatusQuery.data;
		if (!status) return;

		if (!status.isSet || !status.isEnabled) {
			// No PIN set — show the vault directly but offer setup
			setGuardState("unlocked");
		} else {
			// PIN is set — require entry
			setGuardState("locked");
		}
	}, [pinStatusQuery.data, pinStatusQuery.isLoading]);

	const disablePinMutation = useMutation({
		mutationFn: () => fetch("/api/vault/pin", { method: "DELETE" }),
		onSuccess: () => {
			toast.success("Vault PIN disabled");
			queryClient.invalidateQueries({ queryKey: ["vault-pin-status"] });
			setShowDisableConfirm(false);
		},
		onError: () => toast.error("Failed to disable PIN"),
	});

	const isPinSet = pinStatusQuery.data?.isSet ?? false;
	const isPinEnabled = pinStatusQuery.data?.isEnabled ?? false;

	// While loading
	if (guardState === "loading" || pinStatusQuery.isLoading) {
		return (
			<div className="flex h-60 items-center justify-center">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
					className="h-8 w-8 rounded-full border-2 border-violet-500/30 border-t-violet-500"
				/>
			</div>
		);
	}

	// PIN setup flow
	if (guardState === "setting-up" || showChangePin) {
		return (
			<VaultPINSetup
				mode={showChangePin ? "change" : "setup"}
				onComplete={() => {
					queryClient.invalidateQueries({ queryKey: ["vault-pin-status"] });
					setGuardState("unlocked");
					setShowChangePin(false);
					toast.success(
						showChangePin
							? "Vault PIN updated!"
							: "Vault is now PIN-protected!",
					);
				}}
				onBack={() => {
					setGuardState("unlocked");
					setShowChangePin(false);
				}}
			/>
		);
	}

	// PIN entry (locked state)
	if (guardState === "locked") {
		return (
			<VaultPINOverlay
				isPINSet={isPinSet}
				onUnlocked={() => setGuardState("unlocked")}
				onSetup={() => setGuardState("setting-up")}
			/>
		);
	}

	// Unlocked — render the actual vault content with a PIN management bar
	return (
		<>
			{/* PIN Management bar — shown to owner/admin */}
			<div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3 3xl:px-6 3xl:py-4">
				<div className="flex flex-col sm:flex-row flex-wrap gap-2 text-sm text-muted-foreground 3xl:text-base">
					{isPinEnabled ? (
						<>
							<Lock className="h-4 w-4 text-violet-500 3xl:h-5 3xl:w-5" />
							<span>
								Vault is{" "}
								<span className="font-medium text-violet-500">
									PIN-protected
								</span>
							</span>
						</>
					) : (
						<>
							<Unlock className="h-4 w-4 text-muted-foreground 3xl:h-5 3xl:w-5" />
							<span>No PIN protection active</span>
						</>
					)}
				</div>

				<div className="flex items-center gap-2">
					{!isPinEnabled ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setGuardState("setting-up")}
							className="gap-1.5 border-violet-500/30 text-violet-600 hover:bg-violet-500/10 hover:text-violet-700 3xl:text-base"
						>
							<Lock className="h-3.5 w-3.5 3xl:h-4 3xl:w-4" />
							Enable PIN
						</Button>
					) : (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowChangePin(true)}
								className="gap-1.5 text-muted-foreground 3xl:text-base"
							>
								<Settings2 className="h-3.5 w-3.5 3xl:h-4 3xl:w-4" />
								Change PIN
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowDisableConfirm(true)}
								className="gap-1.5 text-red-500 hover:text-red-600 3xl:text-base"
							>
								<X className="h-3.5 w-3.5 3xl:h-4 3xl:w-4" />
								Disable
							</Button>
						</>
					)}
				</div>
			</div>


			{/* Vault content */}
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					{children}
				</motion.div>
			</AnimatePresence>

			{/* Disable PIN confirmation */}
			<AlertDialog
				open={showDisableConfirm}
				onOpenChange={setShowDisableConfirm}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Disable Vault PIN?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove PIN protection from your Legacy
							Vault. Anyone with access to your account will be
							able to open it without a PIN.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Keep PIN</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => disablePinMutation.mutate()}
							className="bg-red-600 hover:bg-red-700"
						>
							Disable PIN
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
