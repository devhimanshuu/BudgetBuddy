"use client";

import React from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Split } from "lucide-react";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";

interface SplitType {
    id: string;
    category: string;
    categoryIcon: string;
    amount: number;
    percentage: number;
}

interface Props {
    splits: SplitType[];
    transactionType: string;
}

function SplitDetailsPopover({ splits, transactionType }: Props) {
    const { isPrivacyMode } = usePrivacyMode();
    const userSettings = useQuery({
        queryKey: ["userSettings"],
        queryFn: () => fetch("/api/user-settings").then((res) => res.json()),
    });

    const currency = userSettings.data?.currency || "USD";
    const formatter = GetFormatterForCurrency(currency);

    const totalAmount = splits.reduce((sum, split) => sum + split.amount, 0);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                    <Split className="h-4 w-4" />
                    <span className="text-xs">{splits.length}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Split Breakdown</h4>
                        <p className="text-sm text-muted-foreground">
                            Distributed across {splits.length} categories.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        {splits.map((split) => {
                            const percent = totalAmount > 0 ? (split.amount / totalAmount) * 100 : 0;
                            return (
                                <div key={split.id} className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            role="img"
                                            aria-label={split.category}
                                            className="text-lg"
                                        >
                                            {split.categoryIcon}
                                        </span>
                                        <span className="text-sm capitalize">{split.category}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div
                                            className={cn(
                                                "font-medium text-sm",
                                                transactionType === "expense"
                                                    ? "text-red-500"
                                                    : "text-emerald-500"
                                            )}
                                        >
                                            {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(split.amount)}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {percent.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default SplitDetailsPopover;
