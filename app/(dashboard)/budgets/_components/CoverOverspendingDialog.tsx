"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { toast } from "sonner";
import { ReallocateBudget } from "../_actions/reallocateBudget";

interface BudgetProgress {
  id: string;
  category: string;
  categoryIcon: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

interface CoverOverspendingDialogProps {
  trigger: ReactNode;
  targetBudget: BudgetProgress;
  budgets: BudgetProgress[];
  month: number;
  year: number;
}

export default function CoverOverspendingDialog({
  trigger,
  targetBudget,
  budgets,
  month,
  year,
}: CoverOverspendingDialogProps) {
  const [open, setOpen] = useState(false);
  const [sourceCategory, setSourceCategory] = useState<string>("");
  
  const overspentAmount = Math.abs(targetBudget.remaining);
  const [amount, setAmount] = useState(overspentAmount.toString());

  const queryClient = useQueryClient();

  const availableSources = budgets.filter((b) => b.remaining > 0 && b.category !== targetBudget.category);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await ReallocateBudget({
        sourceCategory,
        targetCategory: targetBudget.category,
        amount: parseFloat(amount),
        month,
        year,
      });
    },
    onSuccess: () => {
      toast.success("Budget reallocated successfully!");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-progress", month, year] });
      setOpen(false);
      setSourceCategory("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reallocate budget. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceCategory) {
      toast.error("Please select a budget to move money from");
      return;
    }

    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const selectedSource = availableSources.find((b) => b.category === sourceCategory);
    if (selectedSource && amountNum > selectedSource.remaining) {
      toast.error(`You cannot move more than ${selectedSource.remaining} from ${selectedSource.category}`);
      return;
    }

    mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cover Overspending</DialogTitle>
          <DialogDescription>
            Move money from another budget to cover your overspending in {targetBudget.categoryIcon} {targetBudget.category}
          </DialogDescription>
        </DialogHeader>

        {availableSources.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            You don&apos;t have any budgets with remaining funds to cover this overspending.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Move money from...</Label>
              <Select value={sourceCategory} onValueChange={setSourceCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {availableSources.map((budget) => (
                    <SelectItem key={budget.category} value={budget.category}>
                      {budget.categoryIcon} {budget.category} (Available: {budget.remaining.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount to move</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder={overspentAmount.toString()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You overspent by {overspentAmount.toFixed(2)}.
              </p>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Moving..." : "Cover Overspending"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
