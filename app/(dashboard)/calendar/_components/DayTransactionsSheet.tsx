"use client";

import React from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { CalendarDayData } from "@/lib/type";
import { GetPrivacyMask } from "@/lib/helper";

interface DayTransactionsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    date: Date | null;
    dayData: CalendarDayData | null | undefined;
    formatter: Intl.NumberFormat;
    isPrivacyMode?: boolean;
}

export default function DayTransactionsSheet({
    open,
    onOpenChange,
    date,
    dayData,
    formatter,
    isPrivacyMode = false,
}: DayTransactionsSheetProps) {
    if (!date) return null;

    const incomeTransactions = dayData?.transactions.filter((t) => t.type === "income") || [];
    const expenseTransactions = dayData?.transactions.filter((t) => t.type === "expense") || [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{format(date, "EEEE, MMMM d, yyyy")}</SheetTitle>
                    <SheetDescription>
                        {dayData ? `${dayData.count} transaction${dayData.count !== 1 ? "s" : ""}` : "No transactions"}
                    </SheetDescription>
                </SheetHeader>

                {dayData && (
                    <div className="mt-6 space-y-6">
                        {/* Daily Totals */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border bg-emerald-500/10 p-4">
                                <div className="text-sm text-muted-foreground">Income</div>
                                <div className="text-2xl font-bold text-emerald-500">
                                    {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(dayData.income)}
                                </div>
                            </div>
                            <div className="rounded-lg border bg-red-500/10 p-4">
                                <div className="text-sm text-muted-foreground">Expenses</div>
                                <div className="text-2xl font-bold text-red-500">
                                    {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(dayData.expense)}
                                </div>
                            </div>
                        </div>

                        {dayData.isHighSpending && (
                            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                    <span className="text-sm font-medium text-red-500">
                                        High Spending Day
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Income Transactions */}
                        {incomeTransactions.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-sm font-semibold text-emerald-500">
                                    Income ({incomeTransactions.length})
                                </h3>
                                <div className="space-y-2">
                                    {incomeTransactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">{transaction.categoryIcon}</span>
                                                    <div>
                                                        <div className="font-medium">{transaction.description}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {transaction.category}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {format(new Date(transaction.date), "h:mm a")}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-lg font-bold text-emerald-500">
                                                    +{isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(transaction.amount)}
                                                </div>
                                            </div>
                                            {transaction.notes && (
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    {transaction.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expense Transactions */}
                        {expenseTransactions.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-sm font-semibold text-red-500">
                                    Expenses ({expenseTransactions.length})
                                </h3>
                                <div className="space-y-2">
                                    {expenseTransactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">{transaction.categoryIcon}</span>
                                                    <div>
                                                        <div className="font-medium">{transaction.description}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {transaction.category}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {format(new Date(transaction.date), "h:mm a")}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-lg font-bold text-red-500">
                                                    -{isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(transaction.amount)}
                                                </div>
                                            </div>
                                            {transaction.notes && (
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    {transaction.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!dayData && (
                    <div className="flex h-[200px] flex-col items-center justify-center text-center">
                        <div className="text-4xl mb-2">📅</div>
                        <div className="text-lg font-medium">No transactions</div>
                        <div className="text-sm text-muted-foreground">
                            No transactions recorded for this day
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
