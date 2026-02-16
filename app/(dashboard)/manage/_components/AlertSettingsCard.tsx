"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    ShieldAlert,
    TrendingUp,
    AlertCircle,
    Save,
    Loader2,
    Percent,
    Activity
} from "lucide-react";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { UpdateAlertSettings } from "../../_actions/user-settings";
import { useState, useEffect } from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";

export default function AlertSettingsCard() {
    const queryClient = useQueryClient();

    const settingsQuery = useQuery({
        queryKey: ["userSettings"],
        queryFn: () => fetch("/api/user-settings").then((res) => res.json()),
    });

    const [spendingLimitThreshold, setSpendingLimitThreshold] = useState(80);
    const [enableAnomalyDetection, setEnableAnomalyDetection] = useState(true);
    const [anomalyThreshold, setAnomalyThreshold] = useState(2.0);

    // Sync state when data loads
    useEffect(() => {
        if (settingsQuery.data) {
            setSpendingLimitThreshold(settingsQuery.data.spendingLimitThreshold ?? 80);
            setEnableAnomalyDetection(settingsQuery.data.enableAnomalyDetection ?? true);
            setAnomalyThreshold(settingsQuery.data.anomalyThreshold ?? 2.0);
        }
    }, [settingsQuery.data]);

    const mutation = useMutation({
        mutationFn: UpdateAlertSettings,
        onSuccess: () => {
            toast.success("Alert settings updated successfully");
            queryClient.invalidateQueries({ queryKey: ["userSettings"] });
        },
        onError: () => {
            toast.error("Failed to update alert settings");
        },
    });

    const hasChanges =
        spendingLimitThreshold !== settingsQuery.data?.spendingLimitThreshold ||
        enableAnomalyDetection !== settingsQuery.data?.enableAnomalyDetection ||
        anomalyThreshold !== settingsQuery.data?.anomalyThreshold;

    return (
        <SkeletonWrapper isLoading={settingsQuery.isFetching}>
            <Card className="border-orange-500/20 bg-gradient-to-br from-card via-card to-orange-500/5 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                        <Bell className="w-5 h-5" />
                        Spending & Alert Settings
                    </CardTitle>
                    <CardDescription>
                        Configure smart notifications and threshold alerts for your budget
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Budget Threshold Alert */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base flex items-center gap-2">
                                    <Percent className="w-4 h-4 text-orange-500" />
                                    Budget Limit Alert
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Notify when I spend <span className="font-bold text-foreground">{spendingLimitThreshold}%</span> of any category budget
                                </p>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Slider
                                value={[spendingLimitThreshold]}
                                onValueChange={(vals) => setSpendingLimitThreshold(vals[0])}
                                max={100}
                                min={50}
                                step={5}
                                className="py-4"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                <span>Cautious (50%)</span>
                                <span>Critical (100%)</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Anomaly Detection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-blue-500" />
                                    Smart Anomaly Detection
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Detect and notify about unusually large transactions
                                </p>
                            </div>
                            <Switch
                                checked={enableAnomalyDetection}
                                onCheckedChange={setEnableAnomalyDetection}
                            />
                        </div>

                        {enableAnomalyDetection && (
                            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                                    <Activity className="w-4 h-4 text-blue-500 mt-0.5" />
                                    <p className="text-xs text-blue-600 leading-relaxed font-medium">
                                        You&apos;ll be notified if a transaction is more than <span className="font-bold underline decoration-blue-500/30">{anomalyThreshold}x</span> larger than your past 30-day average for its category.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <Slider
                                        value={[anomalyThreshold]}
                                        onValueChange={(vals) => setAnomalyThreshold(vals[0])}
                                        max={10.0}
                                        min={1.5}
                                        step={0.5}
                                        className="py-4"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                        <span>Sensitive (1.5x)</span>
                                        <span>Relaxed (10x)</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <Button
                            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-500/20 rounded-xl"
                            onClick={() => mutation.mutate({
                                spendingLimitThreshold,
                                enableAnomalyDetection,
                                anomalyThreshold
                            })}
                            disabled={mutation.isPending || !hasChanges}
                        >
                            {mutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Alert Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </SkeletonWrapper>
    );
}
