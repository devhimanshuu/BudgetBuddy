"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetFormatterForCurrency } from "@/lib/helper";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { History } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TransactionHistoryPopoverProps {
    transactionId: string;
    currentAmount: number;
    currentDescription: string;
    currentCategory: string;
    currentCategoryIcon: string;
    currentDate: Date;
    currentTagIds: string[];
    currency: string;
}

interface HistoryVersion {
    id: string;
    amount: number;
    description: string;
    notes: string | null;
    date: Date;
    category: string;
    categoryIcon: string;
    type: string;
    tags: string[];
    changedAt: Date;
}

const TransactionHistoryPopover = ({
    transactionId,
    currentAmount,
    currentDescription,
    currentCategory,
    currentCategoryIcon,
    currentDate,
    currentTagIds,
    currency,
}: TransactionHistoryPopoverProps) => {
    const [open, setOpen] = useState(false);
    const formatter = GetFormatterForCurrency(currency);

    const { data: history, isLoading } = useQuery<HistoryVersion[]>({
        queryKey: ["transaction-history", transactionId],
        queryFn: async () => {
            const response = await fetch(
                `/api/transaction-history-versions?transactionId=${transactionId}`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch history");
            }
            const data = await response.json();
            return data.map((item: any) => ({
                ...item,
                date: new Date(item.date),
                changedAt: new Date(item.changedAt),
            }));
        },
        enabled: open, // Only fetch when popover is opened
    });

    const getChangedFields = (version: HistoryVersion, index: number) => {
        const changes: string[] = [];
        const nextVersion = history?.[index + 1];

        if (!nextVersion) {
            // This is the oldest version (original creation)
            return ["Original version"];
        }

        if (version.amount !== nextVersion.amount) {
            changes.push(
                `Amount: ${nextVersion.amount} → ${version.amount}`
            );
        }
        if (version.description !== nextVersion.description) {
            changes.push("Description changed");
        }
        if (version.category !== nextVersion.category) {
            changes.push(
                `Category: ${nextVersion.category} → ${version.category}`
            );
        }
        if (new Date(version.date).getTime() !== new Date(nextVersion.date).getTime()) {
            changes.push("Date changed");
        }
        if (version.notes !== nextVersion.notes) {
            changes.push("Notes changed");
        }
        if (JSON.stringify(version.tags) !== JSON.stringify(nextVersion.tags)) {
            changes.push("Tags changed");
        }

        return changes.length > 0 ? changes : ["Minor changes"];
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="cursor-pointer hover:scale-110 transition-transform">
                    <History className="h-3 w-3 text-amber-500 opacity-70 hover:opacity-100" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="start" side="top">
                <div className="p-4 border-b">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <History className="h-4 w-4 text-amber-500" />
                        Edit History
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        All changes made to this transaction
                    </p>
                </div>

                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading history...
                        </div>
                    ) : !history || history.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No edit history available
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {/* Current Version */}
                            <div className="relative pl-6 pb-4">
                                <div className="absolute left-0 top-2 h-2 w-2 rounded-full bg-green-500" />
                                <div className="absolute left-[3px] top-4 bottom-0 w-[2px] bg-border" />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                            Current
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            Now
                                        </span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{currentDescription}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                            <div>Amount: {formatter.format(currentAmount)}</div>
                                            <div>Category: {currentCategoryIcon} {currentCategory}</div>
                                            <div>Date: {format(currentDate, "PPP")}</div>
                                            {currentTagIds.length > 0 && (
                                                <div>Tags: {currentTagIds.join(", ")}</div>
                                            )}
                                        </div>

                                        {/* Show changes between latest history and current */}
                                        {history && history.length > 0 && (() => {
                                            const latestHistory = history[0];
                                            const changes: string[] = [];
                                            
                                            if (currentAmount !== latestHistory.amount) {
                                                changes.push(`Amount: ${formatter.format(latestHistory.amount)} → ${formatter.format(currentAmount)}`);
                                            }
                                            if (currentDescription !== latestHistory.description) {
                                                changes.push("Description changed");
                                            }
                                            if (currentCategory !== latestHistory.category) {
                                                changes.push(`Category: ${latestHistory.category} → ${currentCategory}`);
                                            }
                                            if (new Date(currentDate).getTime() !== new Date(latestHistory.date).getTime()) {
                                                changes.push("Date changed");
                                            }
                                            if (JSON.stringify(currentTagIds.sort()) !== JSON.stringify(latestHistory.tags.sort())) {
                                                changes.push("Tags changed");
                                            }

                                            if (changes.length > 0) {
                                                return (
                                                    <div className="mt-2 pt-2 border-t border-dashed">
                                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                                            Last Edit Changes:
                                                        </p>
                                                        <ul className="text-xs text-muted-foreground space-y-0.5">
                                                            {changes.map((change, i) => (
                                                                <li key={i} className="flex items-start gap-1">
                                                                    <span className="text-amber-500 mt-0.5">•</span>
                                                                    <span>{change}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* History Versions */}
                            {history.map((version, index) => {
                                const changes = getChangedFields(version, index);
                                const isLast = index === history.length - 1;

                                return (
                                    <div key={version.id} className="relative pl-6 pb-4">
                                        <div className={cn(
                                            "absolute left-0 top-2 h-2 w-2 rounded-full",
                                            isLast ? "bg-blue-500" : "bg-muted-foreground"
                                        )} />
                                        {!isLast && (
                                            <div className="absolute left-[3px] top-4 bottom-0 w-[2px] bg-border" />
                                        )}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                {isLast ? (
                                                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                        Created
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">
                                                        Edited
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {format(version.changedAt, "PPP p")}
                                                </span>
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{version.description}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground space-y-0.5">
                                                    <div>Amount: {formatter.format(version.amount)}</div>
                                                    <div>Category: {version.categoryIcon} {version.category}</div>
                                                    <div>Date: {format(new Date(version.date), "PPP")}</div>
                                                    {version.tags && version.tags.length > 0 && (
                                                        <div>Tags: {version.tags.join(", ")}</div>
                                                    )}
                                                </div>
                                                {changes.length > 0 && !isLast && (
                                                    <div className="mt-2 pt-2 border-t border-dashed">
                                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                                            Changes:
                                                        </p>
                                                        <ul className="text-xs text-muted-foreground space-y-0.5">
                                                            {changes.map((change, i) => (
                                                                <li key={i} className="flex items-start gap-1">
                                                                    <span className="text-amber-500 mt-0.5">•</span>
                                                                    <span>{change}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};

export default TransactionHistoryPopover;
