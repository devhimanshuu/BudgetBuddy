"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TransactionType } from "@/lib/type";
import { Category } from "@prisma/client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Merge, ArrowRight, AlertTriangle, AlertCircle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
    type: TransactionType;
    categories: Category[];
    trigger?: React.ReactNode;
}

export default function MergeCategoriesDialog({ type, categories, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [sourceCategory, setSourceCategory] = useState<string>("");
    const [targetCategory, setTargetCategory] = useState<string>("");

    const queryClient = useQueryClient();

    const mergeMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/manage/merge-categories", {
                method: "POST",
                body: JSON.stringify({
                    sourceCategoryName: sourceCategory,
                    targetCategoryName: targetCategory,
                    type,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to merge categories");
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["categories", type] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            setOpen(false);
            setSourceCategory("");
            setTargetCategory("");
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const handleMerge = () => {
        if (!sourceCategory || !targetCategory) {
            toast.error("Please select both source and target categories");
            return;
        }

        if (sourceCategory === targetCategory) {
            toast.error("Source and target categories must be different");
            return;
        }

        setShowConfirm(true);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline" size="sm" className="gap-2">
                            <Merge className="h-4 w-4" />
                            Merge
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
                            <Merge className="h-5 w-5 shrink-0 text-blue-500" />
                            <span>Merge {type === "income" ? "Income" : "Expense"} Categories</span>
                        </DialogTitle>
                        <DialogDescription>
                            Combine two categories into one. All transactions from the source will be moved to the target.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="source">Source Category (To be removed)</Label>
                            <Select value={sourceCategory} onValueChange={setSourceCategory}>
                                <SelectTrigger id="source">
                                    <SelectValue placeholder="Select source category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={`source-${c.name}`} value={c.name} disabled={c.name === targetCategory}>
                                            <span className="mr-2">{c.icon}</span>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground italic">
                                All transactions in this category will be re-assigned.
                            </p>
                        </div>

                        <div className="flex justify-center flex-col items-center gap-1">
                            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 sm:rotate-0" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="target">Target Category (To keep)</Label>
                            <Select value={targetCategory} onValueChange={setTargetCategory}>
                                <SelectTrigger id="target">
                                    <SelectValue placeholder="Select target category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={`target-${c.name}`} value={c.name} disabled={c.name === sourceCategory}>
                                            <span className="mr-2">{c.icon}</span>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground italic">
                                This category will receive all transactions.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleMerge}
                            disabled={mergeMutation.isPending || !sourceCategory || !targetCategory}
                            className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
                        >
                            {mergeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin mr-2" />
                            ) : (
                                <Merge className="h-4 w-4 shrink-0 mr-2" />
                            )}
                            Execute Merge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-orange-500" />
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            You are about to merge <span className="font-bold text-foreground">&quot;{sourceCategory}&quot;</span> into <span className="font-bold text-foreground">&quot;{targetCategory}&quot;</span>.
                            <br /><br />
                            This will move ALL transactions and delete <span className="font-bold text-foreground">&quot;{sourceCategory}&quot;</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => mergeMutation.mutate()}
                        >
                            Confirm Merge
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
