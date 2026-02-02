"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, SkipForward, Loader2 } from "lucide-react";
import {
    GetDueRecurringTransactions,
    ProcessRecurringTransaction,
    SkipRecurringTransaction,
} from "@/app/(dashboard)/_actions/recurring";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { UserSettings, RecurringTransaction } from "@prisma/client";
import { GetFormatterForCurrency } from "@/lib/helper";

export function DueTransactionsPopup({ userSettings }: { userSettings: UserSettings }) {
    const [open, setOpen] = useState(false);

    const { data: dueTransactions, isLoading, refetch } = useQuery<RecurringTransaction[]>({
        queryKey: ["due-recurring-transactions"],
        queryFn: () => GetDueRecurringTransactions(),
        staleTime: 0, // Always fetch fresh on mount
    });

    useEffect(() => {
        if (dueTransactions && dueTransactions.length > 0) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [dueTransactions]);

    const queryClient = useQueryClient();

    const processMutation = useMutation({
        mutationFn: ProcessRecurringTransaction,
        onSuccess: () => {
            toast.success("Transaction processed");
            queryClient.invalidateQueries({ queryKey: ["due-recurring-transactions"] });
            // The list will update, and if empty, popup closes via useEffect
        },
        onError: (e) => {
            toast.error("Error processing: " + e.message);
        }
    });

    const skipMutation = useMutation({
        mutationFn: SkipRecurringTransaction,
        onSuccess: () => {
            toast.success("Transaction skipped");
            queryClient.invalidateQueries({ queryKey: ["due-recurring-transactions"] });
        },
        onError: (e) => {
            toast.error("Error skipping: " + e.message);
        }
    })

    const formatter = React.useMemo(() => {
        return GetFormatterForCurrency(userSettings.currency);
    }, [userSettings.currency]);

    if (isLoading) return null; // Don't show anything while loading first time

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Recurring Transactions Due</DialogTitle>
                    <DialogDescription>
                        The following recurring transactions are due. Approve to post them to your history.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto">
                    {dueTransactions?.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="flex flex-col gap-2 border p-3 rounded-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{transaction.categoryIcon}</span>
                                    <div>
                                        <p className="font-bold">{transaction.description}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), "PPP")}</p>
                                    </div>
                                </div>
                                <p className={cn(
                                    "font-bold",
                                    transaction.type === "income" ? "text-emerald-500" : "text-red-500"
                                )}>
                                    {transaction.type === "income" ? "+" : "-"}{formatter.format(transaction.amount)}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => skipMutation.mutate(transaction.id)}
                                    disabled={skipMutation.isPending || processMutation.isPending}
                                >
                                    <SkipForward className="mr-1 h-3 w-3" />
                                    Skip
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => processMutation.mutate(transaction.id)}
                                    disabled={skipMutation.isPending || processMutation.isPending}
                                    className={transaction.type === "income" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}
                                >
                                    {processMutation.isPending && processMutation.variables === transaction.id ? <Loader2 className="animate-spin h-3 w-3" /> : (<Check className="mr-1 h-3 w-3" />)}
                                    Approve
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
