"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useMemo } from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { TransactionType } from "@/lib/type";
import { Separator } from "@/components/ui/separator";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: {
        category: string;
        categoryIcon: string;
        amount: number;
    } | null;
    type: TransactionType;
    from: Date;
    to: Date;
    tagIds: string[];
    userSettings: UserSettings;
}

export default function CategoryDrilldownSheet({
    open,
    onOpenChange,
    category,
    type,
    from,
    to,
    tagIds,
    userSettings,
}: Props) {
    const { isPrivacyMode } = usePrivacyMode();
    const formatter = useMemo(() => {
        return GetFormatterForCurrency(userSettings.currency);
    }, [userSettings.currency]);

    const tagQueryParam = tagIds.length > 0 ? `&tags=${tagIds.join(",")}` : "";

    const categoryDetailsQuery = useQuery({
        queryKey: [
            "analytics",
            "category-details",
            category?.category,
            type,
            from,
            to,
            tagIds,
        ],
        queryFn: () =>
            fetch(
                `/api/analytics/category-details?from=${from.toISOString()}&to=${to.toISOString()}&type=${type}&category=${category?.category}${tagQueryParam}`
            ).then((res) => res.json()),
        enabled: open && !!category,
    });

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <span className="text-2xl">{category?.categoryIcon}</span>
                        {category?.category} Details
                    </SheetTitle>
                    <SheetDescription>
                        Showing top transactions for {category?.category} from{" "}
                        {format(from, "MMM d, yyyy")} to {format(to, "MMM d, yyyy")}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <div className="rounded-lg bg-muted p-4">
                        <p className="text-sm text-muted-foreground">Total {type === "expense" ? "Spent" : "Earned"}</p>
                        <p className="text-3xl font-bold">
                            {isPrivacyMode ? GetPrivacyMask(formatter) : (category ? formatter.format(category.amount) : "0")}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Top 5 Transactions</h3>
                        <Separator />
                        <SkeletonWrapper isLoading={categoryDetailsQuery.isFetching}>
                            <div className="space-y-4">
                                {categoryDetailsQuery.data?.length === 0 && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        No transactions found for this period.
                                    </p>
                                )}
                                {categoryDetailsQuery.data?.map((transaction: any) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between rounded-md border p-3"
                                    >
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate font-medium">
                                                {transaction.description || "No description"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(transaction.date), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${type === "expense" ? "text-red-500" : "text-emerald-500"}`}>
                                                {type === "expense" ? "-" : "+"}
                                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(transaction.amount)}
                                            </p>
                                            {transaction.notes && (
                                                <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                                    {transaction.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SkeletonWrapper>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
