"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { syncManager, SyncStatus, SyncResult } from "@/lib/syncManager";
import { offlineStorage } from "@/lib/offlineStorage";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
    const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

    // Update online status
    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOnline(navigator.onLine);
        };

        updateOnlineStatus();
        window.addEventListener("online", updateOnlineStatus);
        window.addEventListener("offline", updateOnlineStatus);

        return () => {
            window.removeEventListener("online", updateOnlineStatus);
            window.removeEventListener("offline", updateOnlineStatus);
        };
    }, []);

    // Update pending count
    useEffect(() => {
        const updatePendingCount = async () => {
            try {
                const count = await offlineStorage.getPendingCount();
                setPendingCount(count);
            } catch (error) {
                console.error("Failed to get pending count:", error);
            }
        };

        updatePendingCount();

        // Update every 5 seconds
        const interval = setInterval(updatePendingCount, 5000);

        return () => clearInterval(interval);
    }, []);

    // Listen to sync status changes
    useEffect(() => {
        const unsubscribe = syncManager.onSyncStatusChange((status, result) => {
            setSyncStatus(status);
            if (result) {
                setLastSyncResult(result);
            }
        });

        return unsubscribe;
    }, []);

    // Handle manual sync
    const handleSync = async () => {
        if (!isOnline) {
            return;
        }
        await syncManager.syncPendingTransactions();
    };

    // Don't show if online and no pending transactions
    if (isOnline && pendingCount === 0 && syncStatus === "idle") {
        return null;
    }

    const getStatusIcon = () => {
        if (!isOnline) {
            return <WifiOff className="h-4 w-4" />;
        }

        if (syncStatus === "syncing") {
            return <RefreshCw className="h-4 w-4 animate-spin" />;
        }

        if (syncStatus === "success") {
            return <Check className="h-4 w-4" />;
        }

        if (syncStatus === "error") {
            return <AlertCircle className="h-4 w-4" />;
        }

        if (pendingCount > 0) {
            return <RefreshCw className="h-4 w-4" />;
        }

        return <Wifi className="h-4 w-4" />;
    };

    const getStatusText = () => {
        if (!isOnline) {
            return "Offline";
        }

        if (syncStatus === "syncing") {
            return "Syncing...";
        }

        if (syncStatus === "success") {
            return "Synced";
        }

        if (syncStatus === "error") {
            return "Sync failed";
        }

        if (pendingCount > 0) {
            return `${pendingCount} pending`;
        }

        return "Online";
    };

    const getTooltipText = () => {
        if (!isOnline) {
            return `You're offline. ${pendingCount} transaction${pendingCount !== 1 ? "s" : ""} will sync when online.`;
        }

        if (syncStatus === "syncing") {
            return "Syncing transactions to server...";
        }

        if (syncStatus === "success" && lastSyncResult) {
            return `Successfully synced ${lastSyncResult.success} transaction${lastSyncResult.success !== 1 ? "s" : ""}`;
        }

        if (syncStatus === "error" && lastSyncResult) {
            return `Failed to sync ${lastSyncResult.failed} transaction${lastSyncResult.failed !== 1 ? "s" : ""}. Will retry automatically.`;
        }

        if (pendingCount > 0) {
            return `${pendingCount} transaction${pendingCount !== 1 ? "s" : ""} waiting to sync. Click to sync now.`;
        }

        return "All transactions synced";
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg transition-all",
                            !isOnline && "bg-red-500 text-white",
                            isOnline && pendingCount === 0 && "bg-green-500 text-white",
                            isOnline && pendingCount > 0 && "bg-yellow-500 text-white",
                            syncStatus === "syncing" && "bg-blue-500 text-white",
                            syncStatus === "error" && "bg-red-500 text-white"
                        )}
                    >
                        {getStatusIcon()}
                        <span className="text-sm font-medium">{getStatusText()}</span>

                        {isOnline && pendingCount > 0 && syncStatus !== "syncing" && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-white hover:bg-white/20 hover:text-white"
                                onClick={handleSync}
                            >
                                Sync
                            </Button>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                    <p>{getTooltipText()}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
