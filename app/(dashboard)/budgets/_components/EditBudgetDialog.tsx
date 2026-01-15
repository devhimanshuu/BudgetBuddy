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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

interface EditBudgetDialogProps {
  trigger: ReactNode;
  budget: {
    id: string;
    category: string;
    categoryIcon: string;
    budgetAmount: number;
  };
  month: number;
  year: number;
}

export default function EditBudgetDialog({
  trigger,
  budget,
  month,
  year,
}: EditBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(budget.budgetAmount.toString());

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { id: string; amount: number }) => {
      const response = await fetch(`/api/budgets?id=${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: data.amount }),
      });

      if (!response.ok) {
        throw new Error("Failed to update budget");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Budget updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-progress", month, year] });
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to update budget. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    mutate({
      id: budget.id,
      amount: amountNum,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>
            Update the budget amount for {budget.categoryIcon} {budget.category}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
              <span className="text-2xl">{budget.categoryIcon}</span>
              <span className="font-medium">{budget.category}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
