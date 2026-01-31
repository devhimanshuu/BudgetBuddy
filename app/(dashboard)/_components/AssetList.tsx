"use client";

import GlassCard from "@/components/GlassCard";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";

interface AssetListProps {
    userSettings: UserSettings;
    type: "asset" | "liability";
}

interface Asset {
    id: string;
    name: string;
    description?: string;
    type: string;
    category: string;
    currentValue: number;
    icon: string;
    color: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    history: Array<{
        id: string;
        value: number;
        date: string;
        notes?: string;
    }>;
}

export default function AssetList({ userSettings, type }: AssetListProps) {
    const { isPrivacyMode } = usePrivacyMode();
    const queryClient = useQueryClient();

    const assetsQuery = useQuery<Asset[]>({
        queryKey: ["assets", type],
        queryFn: () =>
            fetch(`/api/assets?type=${type}`).then((res) => res.json()),
    });

    const formatter = useMemo(() => {
        return GetFormatterForCurrency(userSettings.currency);
    }, [userSettings.currency]);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/assets/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete");
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success(`${type === "asset" ? "Asset" : "Liability"} deleted`);
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            queryClient.invalidateQueries({ queryKey: ["net-worth"] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Ensure assets is always an array
    const assets = Array.isArray(assetsQuery.data) ? assetsQuery.data : [];
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

    // Calculate trend for each asset
    const getAssetTrend = (asset: Asset) => {
        if (asset.history.length < 2) return null;

        const latest = asset.history[0];
        const previous = asset.history[1];

        const change = latest.value - previous.value;
        const changePercent = (change / previous.value) * 100;

        return {
            change,
            changePercent,
            isPositive: change > 0,
        };
    };

    return (
        <SkeletonWrapper isLoading={assetsQuery.isFetching}>
            <GlassCard>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl 3xl:text-2xl">
                            {type === "asset" ? "Assets" : "Liabilities"}
                        </CardTitle>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p
                                className={cn(
                                    "text-2xl font-bold 3xl:text-3xl",
                                    type === "asset" ? "text-blue-600" : "text-red-600"
                                )}
                            >
                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(totalValue)}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {assets.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-muted-foreground">
                            <p>
                                No {type === "asset" ? "assets" : "liabilities"} yet. Add one to
                                get started!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {assets.map((asset) => {
                                const trend = getAssetTrend(asset);
                                return (
                                    <div
                                        key={asset.id}
                                        className="flex items-center justify-between rounded-lg border bg-card/50 p-4 transition-colors hover:bg-card"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                                                style={{ backgroundColor: `${asset.color}20` }}
                                            >
                                                {asset.icon}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{asset.name}</p>
                                                {asset.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {asset.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {asset.category.replace("-", " ")}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-bold">
                                                    {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(asset.currentValue)}
                                                </p>
                                                {trend && (
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-1 text-sm",
                                                            trend.isPositive
                                                                ? "text-emerald-600"
                                                                : "text-red-600"
                                                        )}
                                                    >
                                                        {trend.isPositive ? (
                                                            <TrendingUp className="h-3 w-3" />
                                                        ) : (
                                                            <TrendingDown className="h-3 w-3" />
                                                        )}
                                                        <span>
                                                            {trend.isPositive ? "+" : ""}
                                                            {trend.changePercent.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => deleteMutation.mutate(asset.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </GlassCard>
        </SkeletonWrapper>
    );
}
