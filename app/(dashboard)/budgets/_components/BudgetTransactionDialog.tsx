"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, ExternalLink, Paperclip, Tag as TagIcon, StickyNote } from "lucide-react";
import { format } from "date-fns";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    totalAmount: number;
    formattedAmount: string;
    formattedTotalAmount: string;
    category: string;
    categoryIcon: string;
    isSplit: boolean;
    notes?: string;
    tags: { id: string; name: string; color: string }[];
    attachmentsCount: number;
}

interface Props {
    category: string;
    categoryIcon: string;
    month: number;
    year: number;
    trigger: React.ReactNode;
}

export default function BudgetTransactionDialog({
    category,
    categoryIcon,
    month,
    year,
    trigger,
}: Props) {
    const transactionsQuery = useQuery<Transaction[]>({
        queryKey: ["budget-transactions", category, month, year],
        queryFn: () =>
            fetch(
                `/api/budgets/transactions?category=${encodeURIComponent(
                    category
                )}&month=${month}&year=${year}`
            ).then((res) => res.json()),
    });

    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">{categoryIcon}</span>
                        {category} History - {format(new Date(year, month), "MMMM yyyy")}
                    </DialogTitle>
                </DialogHeader>

                <SkeletonWrapper isLoading={transactionsQuery.isLoading}>
                    <div className="space-y-4">
                        {transactionsQuery.data && transactionsQuery.data.length > 0 ? (
                            <div className="divide-y rounded-md border">
                                {transactionsQuery.data.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(transaction.date), "MMM dd, yyyy")}
                                                </span>
                                                {transaction.isSplit && (
                                                    <Badge variant="outline" className="text-[10px] h-4 py-0 uppercase">
                                                        Split
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="font-medium truncate pr-4">
                                                {transaction.description || "No description"}
                                            </span>

                                            {/* Tags & Extras */}
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                {transaction.tags.map(tag => (
                                                    <Badge
                                                        key={tag.id}
                                                        variant="secondary"
                                                        className="text-[10px] h-4 px-1"
                                                        style={{
                                                            backgroundColor: `${tag.color}20`,
                                                            color: tag.color,
                                                            borderColor: `${tag.color}40`
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                ))}

                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    {transaction.notes && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <StickyNote className="h-3.5 w-3.5" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="max-w-xs">{transaction.notes}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {transaction.attachmentsCount > 0 && (
                                                        <div className="flex items-center gap-0.5" title={`${transaction.attachmentsCount} attachments`}>
                                                            <Paperclip className="h-3.5 w-3.5" />
                                                            <span className="text-[10px]">{transaction.attachmentsCount}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1 ml-4">
                                            <span className="text-lg font-bold text-red-500">
                                                {transaction.formattedAmount}
                                            </span>
                                            {transaction.isSplit && (
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    Total: {transaction.formattedTotalAmount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="rounded-full bg-muted p-4 mb-4">
                                    <History className="h-8 w-8 text-muted-foreground opacity-50" />
                                </div>
                                <p className="text-muted-foreground font-medium">No transactions found</p>
                                <p className="text-sm text-muted-foreground/70">
                                    Transactions in this category will appear here
                                </p>
                            </div>
                        )}
                    </div>
                </SkeletonWrapper>
            </DialogContent>
        </Dialog>
    );
}
