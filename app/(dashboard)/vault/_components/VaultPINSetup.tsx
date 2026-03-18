"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Delete,
	Lock,
	CheckCircle2,
	Eye,
	EyeOff,
	ArrowLeft,
	ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SetupStep = "enter" | "confirm" | "success";

interface VaultPINSetupProps {
	onComplete: () => void;
	onBack: () => void;
	mode: "setup" | "change";
}

export default function VaultPINSetup({
	onComplete,
	onBack,
	mode,
}: VaultPINSetupProps) {
	const [step, setStep] = useState<SetupStep>("enter");
	const [firstPin, setFirstPin] = useState("");
	const [confirmPin, setConfirmPin] = useState("");
	const [mismatch, setMismatch] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const activePin = step === "enter" ? firstPin : confirmPin;
	const setActivePin = step === "enter" ? setFirstPin : setConfirmPin;

	const handleDigit = useCallback(
		(digit: string) => {
			if (activePin.length >= 8) return;
			setActivePin((prev) => prev + digit);
			setMismatch(false);
		},
		[activePin.length, setActivePin],
	);

	const handleDelete = useCallback(() => {
		setActivePin((prev) => prev.slice(0, -1));
		setMismatch(false);
	}, [setActivePin]);

	const handleContinue = useCallback(async () => {
		if (step === "enter") {
			if (firstPin.length < 4) return;
			setStep("confirm");
		} else {
			// Confirm step
			if (confirmPin.length < 4) return;
			if (confirmPin !== firstPin) {
				setMismatch(true);
				setConfirmPin("");
				toast.error("PINs don't match. Please try again.");
				return;
			}

			// Save the PIN
			setIsSaving(true);
			try {
				const res = await fetch("/api/vault/pin", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ pin: firstPin }),
				});

				if (res.ok) {
					setStep("success");
					setTimeout(onComplete, 1500);
				} else {
					const data = await res.json();
					toast.error(data.error || "Failed to save PIN");
				}
			} catch {
				toast.error("An error occurred. Please try again.");
			} finally {
				setIsSaving(false);
			}
		}
	}, [step, firstPin, confirmPin, onComplete]);

	// Keyboard support
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
			else if (e.key === "Backspace") handleDelete();
			else if (e.key === "Enter") handleContinue();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handleDigit, handleDelete, handleContinue]);

	const NUMPAD = [
		["1", "2", "3"],
		["4", "5", "6"],
		["7", "8", "9"],
		["", "0", "⌫"],
	];

	const currentPin = step === "enter" ? firstPin : confirmPin;
	const displayDots = Array.from({ length: Math.max(currentPin.length, 4) }).map(
		(_, i) => i < currentPin.length,
	);

	return (
		<div className="fixed top-[80px] md:top-[60px] 3xl:top-[100px] inset-x-0 bottom-0 z-40 flex items-center justify-center bg-background/95 backdrop-blur-xl">
			{/* Ambient glow */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
			</div>

			<motion.div
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
				className="relative w-full max-w-sm px-4"
			>
				<div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
					{/* Top gradient */}
					<div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

					<div className="p-8 space-y-8">
						{/* Back button */}
						<button
							onClick={onBack}
							className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</button>

						{/* Header */}
						<div className="flex flex-col items-center gap-3 text-center">
							<AnimatePresence mode="wait">
								{step === "success" ? (
									<motion.div
										key="success"
										initial={{ scale: 0, rotate: -180 }}
										animate={{ scale: 1, rotate: 0 }}
										transition={{
											type: "spring",
											stiffness: 300,
											damping: 20,
										}}
										className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15"
									>
										<CheckCircle2 className="h-8 w-8 text-emerald-500" />
									</motion.div>
								) : (
									<motion.div
										key={step}
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 relative"
									>
										<Lock className="h-8 w-8 text-violet-500" />
										{step === "confirm" && (
											<span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-xs text-white">
												2
											</span>
										)}
									</motion.div>
								)}
							</AnimatePresence>

							<AnimatePresence mode="wait">
								<motion.div
									key={step}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
								>
									<h2 className="text-xl font-bold">
										{step === "success"
											? "PIN Set Successfully"
											: step === "confirm"
												? "Confirm Your PIN"
												: mode === "change"
													? "Enter New PIN"
													: "Create a PIN"}
									</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										{step === "success"
											? "Your vault is now protected"
											: step === "confirm"
												? "Re-enter your PIN to confirm"
												: "Choose a 4–8 digit PIN to protect your Legacy Vault"}
									</p>
								</motion.div>
							</AnimatePresence>
						</div>

						{/* PIN Dots */}
						{step !== "success" && (
							<motion.div
								animate={
									mismatch
										? { x: [0, -10, 10, -10, 10, 0] }
										: {}
								}
								transition={{ duration: 0.5 }}
								className="flex justify-center gap-3"
							>
								{displayDots.map((filled, i) => (
									<motion.div
										key={i}
										animate={{
											scale: filled ? 1.15 : 1,
											backgroundColor: filled
												? mismatch
													? "hsl(0, 84%, 60%)"
													: "hsl(var(--primary))"
												: "transparent",
										}}
										transition={{
											type: "spring",
											stiffness: 400,
											damping: 20,
										}}
										className={cn(
											"h-4 w-4 rounded-full border-2 transition-all",
											mismatch
												? "border-red-500/50"
												: filled
													? "border-primary"
													: "border-primary/50",
										)}
									/>
								))}
							</motion.div>
						)}

						{/* Numpad */}
						{step !== "success" && (
							<div className="grid grid-cols-3 gap-3">
								{NUMPAD.flat().map((key, i) => {
									if (key === "") return <div key={i} />;
									if (key === "⌫") {
										return (
											<motion.button
												key={i}
												whileTap={{ scale: 0.92 }}
												onClick={handleDelete}
												className="flex h-14 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground transition-colors hover:bg-muted"
											>
												<Delete className="h-5 w-5" />
											</motion.button>
										);
									}
									return (
										<motion.button
											key={i}
											whileTap={{ scale: 0.92 }}
											onClick={() => handleDigit(key)}
											className="flex h-14 items-center justify-center rounded-xl border border-border bg-card text-lg font-semibold shadow-sm transition-all hover:border-violet-500/50 hover:bg-violet-500/5 hover:text-violet-600"
										>
											{key}
										</motion.button>
									);
								})}
							</div>
						)}

						{/* Continue / Submit */}
						{step !== "success" && (
							<Button
								onClick={handleContinue}
								disabled={currentPin.length < 4 || isSaving}
								className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-purple-700"
							>
								{isSaving ? (
									<>
										<motion.div
											animate={{ rotate: 360 }}
											transition={{
												duration: 1,
												repeat: Infinity,
												ease: "linear",
											}}
											className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
										/>
										Saving...
									</>
								) : step === "enter" ? (
									<>
										<ShieldCheck className="h-4 w-4" />
										Continue
									</>
								) : (
									<>
										<Lock className="h-4 w-4" />
										Set PIN
									</>
								)}
							</Button>
						)}
					</div>
				</div>
			</motion.div>
		</div>
	);
}
