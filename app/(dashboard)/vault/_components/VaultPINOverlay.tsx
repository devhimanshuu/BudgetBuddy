"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, ShieldAlert, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VaultPINOverlayProps {
	onUnlocked: () => void;
	onSetup: () => void;
	isPINSet: boolean;
}

const MAX_ATTEMPTS = 5;
const PIN_LENGTH = 6; // Display dots, but allow 4–8 digit entry

export default function VaultPINOverlay({
	onUnlocked,
	onSetup,
	isPINSet,
}: VaultPINOverlayProps) {
	const [pin, setPin] = useState("");
	const [shake, setShake] = useState(false);
	const [attempts, setAttempts] = useState(0);
	const [isLocked, setIsLocked] = useState(false);
	const [lockTimer, setLockTimer] = useState(0);
	const [isVerifying, setIsVerifying] = useState(false);
	const [success, setSuccess] = useState(false);

	// Countdown timer when locked out
	useEffect(() => {
		if (!isLocked || lockTimer <= 0) return;
		const t = setInterval(() => {
			setLockTimer((prev) => {
				if (prev <= 1) {
					setIsLocked(false);
					setAttempts(0);
					clearInterval(t);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(t);
	}, [isLocked, lockTimer]);

	const handleVerify = useCallback(
		async (currentPin: string) => {
			if (currentPin.length < 4 || isVerifying) return;
			setIsVerifying(true);

			try {
				const res = await fetch("/api/vault/pin", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ pin: currentPin }),
				});

				if (res.ok) {
					setSuccess(true);
					// Ping the Heartbeat to reset Dead Man's Switch timer
					fetch("/api/vault/dms", { method: "PUT" });
					setTimeout(() => {
						onUnlocked();
					}, 600);
				} else {
					const newAttempts = attempts + 1;
					setAttempts(newAttempts);
					setPin("");
					setShake(true);
					setTimeout(() => setShake(false), 650);

					if (newAttempts >= MAX_ATTEMPTS) {
						setIsLocked(true);
						setLockTimer(30);
						toast.error(
							"Too many wrong attempts. Vault locked for 30 seconds.",
						);
					} else {
						toast.error(
							`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
						);
					}
				}
			} catch {
				toast.error("An error occurred. Please try again.");
			} finally {
				setIsVerifying(false);
			}
		},
		[attempts, isVerifying, onUnlocked],
	);

	const handleDigit = useCallback(
		(digit: string) => {
			if (isLocked || isVerifying || success) return;
			const next = pin + digit;
			if (next.length > 8) return; // Max 8 digits
			setPin(next);
			// Auto-submit when PIN reaches 4+ digits and user clicks submit
		},
		[pin, isLocked, isVerifying, success],
	);

	const handleDelete = useCallback(() => {
		setPin((prev) => prev.slice(0, -1));
	}, []);

	const handleSubmit = useCallback(() => {
		if (pin.length >= 4) handleVerify(pin);
	}, [pin, handleVerify]);

	// Keyboard support
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
			else if (e.key === "Backspace") handleDelete();
			else if (e.key === "Enter") handleSubmit();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handleDigit, handleDelete, handleSubmit]);

	const NUMPAD = [
		["1", "2", "3"],
		["4", "5", "6"],
		["7", "8", "9"],
		["", "0", "⌫"],
	];

	const displayDots = Array.from({ length: Math.max(pin.length, 4) }).map(
		(_, i) => i < pin.length,
	);

	return (
		<div className="fixed top-[80px] md:top-[60px] 3xl:top-[100px] inset-x-0 bottom-0 z-40 flex items-center justify-center bg-background/95 backdrop-blur-xl">
			{/* Ambient glow */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
				<div className="absolute left-1/4 top-1/4 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-2xl" />
			</div>

			<motion.div
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
				className="relative w-full max-w-sm px-4"
			>
				{/* Card */}
				<div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
					{/* Top gradient bar */}
					<div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

					<div className="p-8 space-y-8">
						{/* Header */}
						<div className="flex flex-col items-center gap-3 text-center">
							<AnimatePresence mode="wait">
								{success ? (
									<motion.div
										key="success"
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15"
									>
										<CheckCircle2 className="h-8 w-8 text-emerald-500" />
									</motion.div>
								) : isLocked ? (
									<motion.div
										key="locked"
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15"
									>
										<ShieldAlert className="h-8 w-8 text-red-500" />
									</motion.div>
								) : (
									<motion.div
										key="lock"
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15"
									>
										<Lock className="h-8 w-8 text-violet-500" />
									</motion.div>
								)}
							</AnimatePresence>

							<div>
								<h2 className="text-xl font-bold">
									{success
										? "Vault Unlocked"
										: isLocked
											? "Vault Locked"
											: "Legacy Vault"}
								</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									{success
										? "Welcome back"
										: isLocked
											? `Too many attempts. Wait ${lockTimer}s`
											: "Enter your PIN to continue"}
								</p>
							</div>
						</div>

						{/* PIN Dots */}
						{!success && (
							<motion.div
								animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
								transition={{ duration: 0.5 }}
								className="flex justify-center gap-3"
							>
								{displayDots.map((filled, i) => (
									<motion.div
										key={i}
										animate={{
											scale: filled ? 1.15 : 1,
											backgroundColor: filled
												? "hsl(var(--primary))"
												: "transparent",
										}}
										transition={{ type: "spring", stiffness: 400, damping: 20 }}
										className={cn(
											"h-4 w-4 rounded-full border-2 border-primary/50 transition-all",
											filled && "border-primary",
										)}
									/>
								))}
							</motion.div>
						)}

						{/* Attempt indicator */}
						{attempts > 0 && !isLocked && !success && (
							<p className="text-center text-xs text-red-500">
								{MAX_ATTEMPTS - attempts} attempt
								{MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} left
							</p>
						)}

						{/* Numpad */}
						{!success && (
							<div
								className={cn(
									"grid grid-cols-3 gap-3",
									isLocked && "pointer-events-none opacity-40",
								)}
							>
								{NUMPAD.flat().map((key, i) => {
									if (key === "") return <div key={i} />;
									if (key === "⌫") {
										return (
											<motion.button
												key={i}
												whileTap={{ scale: 0.92 }}
												onClick={handleDelete}
												className="flex h-14 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground transition-colors hover:bg-muted active:bg-muted/80"
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
											className="relative flex h-14 items-center justify-center overflow-hidden rounded-xl border border-border bg-card text-lg font-semibold shadow-sm transition-all hover:border-violet-500/50 hover:bg-violet-500/5 hover:text-violet-600 active:scale-95"
										>
											{key}
											{/* Ripple effect */}
											<span className="absolute inset-0 rounded-xl" />
										</motion.button>
									);
								})}
							</div>
						)}

						{/* Submit button */}
						{!success && !isLocked && (
							<Button
								onClick={handleSubmit}
								disabled={pin.length < 4 || isVerifying}
								className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-violet-500/30"
							>
								{isVerifying ? (
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
										Verifying...
									</>
								) : (
									<>
										<Lock className="h-4 w-4" />
										Unlock Vault
									</>
								)}
							</Button>
						)}

						{/* Setup link (if no PIN yet, shouldn't appear here, but as fallback) */}
						<div className="flex flex-col gap-2 mt-2">
							{!isPINSet && !success && (
								<p className="text-center text-xs text-muted-foreground">
									No PIN set?{" "}
									<button
										onClick={onSetup}
										className="font-medium text-violet-500 underline-offset-2 hover:underline"
									>
										Set one now
									</button>
								</p>
							)}
							{isPINSet && !success && (
								<p className="text-center text-xs text-muted-foreground">
									Forgot PIN?{" "}
									<button
										onClick={() => {
											if (
												confirm(
													"For security, resetting your PIN will disable the vault lock temporarily. You will need to set a new PIN. Proceed?",
												)
											) {
												fetch("/api/vault/pin", {
													method: "DELETE",
												}).then(() => {
													toast.success(
														"Vault lock disabled. Please set a new PIN.",
													);
													window.location.reload();
												});
											}
										}}
										className="font-medium text-violet-500 underline-offset-2 hover:underline"
									>
										Reset PIN
									</button>
								</p>
							)}
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
