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
    const investmentTransactions = dayData?.transactions.filter((t) => t.type === "investment") || [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-heading-lg">{format(date, "EEEE, MMM d, yyyy")}</SheetTitle>
                    <SheetDescription className="text-body-premium">
                        {dayData ? `${dayData.count} confirmed transactions` : "No confirmed activity"}
                    </SheetDescription>
                </SheetHeader>


                {dayData && (
                    <div className="mt-6 space-y-6">
                        {/* Daily Totals */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="rounded-lg border bg-emerald-500/10 p-2 sm:p-4">
                                <div className="text-[10px] sm:text-sm text-muted-foreground">Income</div>
                                <div className="text-sm sm:text-2xl font-bold text-emerald-500 truncate">
                                    {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(dayData.income)}
                                </div>
                            </div>
                            <div className="rounded-lg border bg-red-500/10 p-2 sm:p-4">
                                <div className="text-[10px] sm:text-sm text-muted-foreground">Expenses</div>
                                <div className="text-sm sm:text-2xl font-bold text-red-500 truncate">
                                    {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(dayData.expense)}
                                </div>
                            </div>
                            <div className="rounded-lg border bg-indigo-500/10 p-2 sm:p-4">
                                <div className="text-[10px] sm:text-sm text-muted-foreground">Investments</div>
                                <div className="text-sm sm:text-2xl font-bold text-indigo-500 truncate">
                                    {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(dayData.investment || 0)}
                                </div>
                            </div>
                        </div>

                        {/* Milestone & Streak Badges */}
                        <div className="flex flex-wrap gap-2">
                            {dayData.isGoalMilestone && (
                                <div className="w-full rounded-2xl border-2 border-amber-400 bg-amber-400/10 p-4 animate-bounce">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">🎯</div>
                                        <div>
                                            <div className="text-heading-md text-amber-600">Goal Milestone!</div>
                                            <div className="text-xs font-medium text-amber-700/70">
                                                Target reached for: {dayData.milestoneDetails?.[0]?.name}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {dayData.expense === 0 && dayData.investment === 0 && (
                                <div className="w-full rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">✨</div>
                                        <div className="text-heading-sm text-amber-600">Perfect "No Spend" Day!</div>
                                    </div>
                                </div>
                            )}

                            {dayData.isHighSpending && (
                                <div className="w-full rounded-2xl border border-rose-500/50 bg-rose-500/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]" />
                                        <span className="text-heading-sm text-rose-500">Critical Spending Day</span>
                                    </div>
                                </div>
                            )}
                        </div>


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

                        {/* Recurring Predicted Bills */}
                        {dayData.isRecurringDue && dayData.recurringItems && dayData.recurringItems.length > 0 && (
                            <div>
                                <h3 className="mb-4 text-heading-md text-rose-500 flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                    Predicted Bills ({dayData.recurringItems.length})
                                </h3>
                                <div className="space-y-3">
                                    {dayData.recurringItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-2xl border border-dashed border-rose-500/30 bg-rose-500/[0.02] p-4 group hover:bg-rose-500/[0.05] transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">
                                                        {item.categoryIcon}
                                                    </div>
                                                    <div>
                                                        <div className="text-heading-md leading-none mb-1">{item.description}</div>
                                                        <div className="text-heading-sm text-muted-foreground">{item.category}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-heading-lg text-rose-600">
                                                        -{isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(item.amount)}
                                                    </div>
                                                    <div className="text-[10px] font-black uppercase text-rose-500/70 tracking-widest mt-1">Due Soon</div>
                                                </div>
                                            </div>
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
