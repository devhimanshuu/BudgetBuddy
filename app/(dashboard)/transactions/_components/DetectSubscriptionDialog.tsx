"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DetectRecurringTransactions,
    CreateRecurringTransaction,
    SuspectedSubscription,
} from "@/app/(dashboard)/_actions/recurring";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function DetectSubscriptionDialog() {
    const [open, setOpen] = React.useState(false);
    const queryClient = useQueryClient();

    const { data: candidates, isLoading, error } = useQuery({
        queryKey: ["detect-subscriptions"],
        queryFn: DetectRecurringTransactions,
        enabled: open, // only run when dialog is open
    });

    const createMutation = useMutation({
        mutationFn: CreateRecurringTransaction,
        onSuccess: () => {
            toast.success("Subscription added successfully");
            queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["detect-subscriptions"] });
        },
        onError: (e) => {
            toast.error("Failed to add subscription: " + e.message);
        }
    });

    const handleAdd = (candidate: SuspectedSubscription) => {
        createMutation.mutate({
            description: candidate.description,
            amount: candidate.amount,
            interval: candidate.interval,
            type: candidate.type,
            category: candidate.category,
            date: candidate.nextDate,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="gap-2 text-violet-500 border border-violet-200 hover:text-violet-600 hover:bg-gray-300 hover:border-violet-600">
                    <Sparkles className="h-4 w-4" />
                    Scan for Subscriptions
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-500" />
                        Subscription Genius
                    </DialogTitle>
                    <DialogDescription>
                        We analyzed your history to find potential subscriptions you might have missed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <p>Analyzing transactions (this may take a moment)...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-4 text-red-500 bg-red-50 rounded-lg">
                            <AlertCircle className="h-5 w-5" />
                            <p>Failed to analyze transactions. Please try again later.</p>
                        </div>
                    )}

                    {!isLoading && candidates?.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No new potential subscriptions found.</p>
                            <p className="text-sm mt-1">We'll keep looking!</p>
                        </div>
                    )}

                    {!isLoading && candidates && candidates.length > 0 && (
                        <div className="grid gap-4">
                            {candidates.map((candidate, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">{candidate.categoryIcon}</div>
                                        <div>
                                            <h4 className="font-semibold">{candidate.description}</h4>
                                            <div className="text-sm text-muted-foreground flex gap-2">
                                                <span className="capitalize">{candidate.interval}</span>
                                                <span>•</span>
                                                <span>Next: {format(new Date(candidate.nextDate), "MMM d")}</span>
                                                <span>•</span>
                                                <span className={cn(
                                                    "font-medium",
                                                    candidate.confidence > 0.8 ? "text-green-600" : "text-amber-600"
                                                )}>
                                                    {Math.round(candidate.confidence * 100)}% Match
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className={cn(
                                                "font-bold text-lg",
                                                candidate.type === "income" ? "text-emerald-500" : "text-red-500"
                                            )}>
                                                {candidate.type === "income" ? "+" : "-"}{candidate.amount}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleAdd(candidate)}
                                            className="bg-violet-600 hover:bg-violet-700 text-white"
                                            disabled={createMutation.isPending}
                                        >
                                            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            <span className="ml-1">Add</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
