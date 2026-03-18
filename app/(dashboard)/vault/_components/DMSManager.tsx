"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, differenceInDays, addDays } from "date-fns";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
	AlertTriangle,
	ShieldCheck,
	Clock,
	Users,
	Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DMSManager() {
	const queryClient = useQueryClient();

	const { data: settings, isLoading } = useQuery({
		queryKey: ["vault-dms"],
		queryFn: () => fetch("/api/vault/dms").then((res) => res.json()),
	});

	const updateMutation = useMutation({
		mutationFn: (data: any) =>
			fetch("/api/vault/dms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}).then((res) => res.json()),
		onSuccess: () => {
			toast.success("Dead man's switch settings updated");
			queryClient.invalidateQueries({ queryKey: ["vault-dms"] });
		},
		onError: () => toast.error("Failed to update settings"),
	});

	const pingMutation = useMutation({
		mutationFn: () => fetch("/api/vault/dms", { method: "PUT" }).then((res) => res.json()),
		onSuccess: () => {
			toast.success("Vault activity marked!");
			queryClient.invalidateQueries({ queryKey: ["vault-dms"] });
		},
		onError: () => toast.error("Failed to mark activity"),
	});

	if (isLoading) return null;

	const daysSinceActivity = differenceInDays(
		new Date(),
		new Date(settings?.lastVaultActivity || new Date()),
	);
	const daysRemaining = (settings?.dmsThresholdDays || 30) - daysSinceActivity;
	const isAtRisk = daysRemaining <= 7 && settings?.dmsEnabled;

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			{/* Status Card */}
			<Card className={cn(isAtRisk && "border-red-500 shadow-md shadow-red-500/10")}>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Activity className="h-5 w-5 text-violet-500" />
							<CardTitle>System Heartbeat</CardTitle>
						</div>
						<Badge variant={settings?.dmsEnabled ? "default" : "secondary"}>
							{settings?.dmsEnabled ? "Armed" : "Disarmed"}
						</Badge>
					</div>
					<CardDescription>
						Monitor your vault&apos;s emergency readiness and heartbeat.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between rounded-lg border p-3">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
								<Clock className="h-5 w-5" />
							</div>
							<div>
								<p className="text-sm font-medium">Last Login Beat</p>
								<p className="text-xs text-muted-foreground">
									{format(
										new Date(settings?.lastVaultActivity || new Date()),
										"MMM d, yyyy 'at' h:mm a",
									)}
								</p>
							</div>
						</div>
						<Button variant="outline" size="sm" onClick={() => pingMutation.mutate()}>
							Ping Now
						</Button>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground font-medium">Reset Countdown</span>
							<span className={cn("font-bold", staysAtRisk(daysRemaining))}>
								{daysRemaining} days left
							</span>
						</div>
						<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
							<div
								className={cn(
									"h-full transition-all duration-500",
									isAtRisk ? "bg-red-500" : "bg-violet-500",
								)}
								style={{
									width: `${Math.max(
										0,
										Math.min(100, (daysRemaining / settings?.dmsThresholdDays) * 100),
									)}%`,
								}}
							/>
						</div>
					</div>

					{isAtRisk ? (
						<div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-600">
							<AlertTriangle className="h-4 w-4" />
							<p className="text-xs font-semibold">
								Urgent: Dead man&apos;s switch will activate soon!
							</p>
						</div>
					) : (
						<div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-emerald-600">
							<ShieldCheck className="h-4 w-4" />
							<p className="text-xs font-semibold">
								Your vault is secure and your legacy is protected.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Configuration Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5 text-violet-500" />
						<CardTitle>Activation Protocol</CardTitle>
					</div>
					<CardDescription>
						Configure when your beneficiaries should receive access to your vault.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm">
						<div className="flex flex-col space-y-1">
							<Label htmlFor="dms-switch" className="text-base font-semibold">
								Dead Man&apos;s Switch (DMS)
							</Label>
							<p className="text-xs text-muted-foreground">
								Once disarmed, your beneficiaries will NOT receive access automatically.
							</p>
						</div>
						<Switch
							id="dms-switch"
							checked={settings?.dmsEnabled}
							onCheckedChange={(checked) =>
								updateMutation.mutate({
									dmsEnabled: checked,
									dmsThresholdDays: settings?.dmsThresholdDays,
								})
							}
						/>
					</div>

					<div className="space-y-4">
						<div className="flex justify-between">
							<Label className="text-sm font-semibold">Inactivity Threshold</Label>
							<span className="text-sm font-bold text-violet-600">
								{settings?.dmsThresholdDays} Days
							</span>
						</div>
						<Slider
							value={[settings?.dmsThresholdDays || 30]}
							min={7}
							max={180}
							step={1}
							disabled={!settings?.dmsEnabled}
							onValueChange={(val) =>
								updateMutation.mutate({
									dmsEnabled: settings?.dmsEnabled,
									dmsThresholdDays: val[0],
								})
							}
							className={cn(!settings?.dmsEnabled && "opacity-50")}
						/>
						<p className="text-xs text-muted-foreground italic">
							* If you don&apos;t engage with the vault for {settings?.dmsThresholdDays} days,
							access will be granted on{" "}
							{format(
								addDays(new Date(settings?.lastVaultActivity || new Date()), settings?.dmsThresholdDays || 30),
								"PPP",
							)}
							.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function staysAtRisk(days: number) {
	if (days <= 3) return "text-red-500";
	if (days <= 7) return "text-orange-500";
	return "text-violet-500";
}
