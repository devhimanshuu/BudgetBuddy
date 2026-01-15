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
import CategoryPicker from "../../_components/CategoryPicker";

interface CreateBudgetDialogProps {
  trigger: ReactNode;
  month: number;
  year: number;
  existingBudget?: {
    id: string;
    category: string;
    categoryIcon: string;
    amount: number;
  };
}

export default function CreateBudgetDialog({
  trigger,
  month,
  year,
  existingBudget,
}: CreateBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(existingBudget?.category || "");
  const [categoryIcon, setCategoryIcon] = useState(
    existingBudget?.categoryIcon || ""
  );
  const [amount, setAmount] = useState(
    existingBudget?.amount?.toString() || ""
  );

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: {
      category: string;
      categoryIcon: string;
      amount: number;
      month: number;
      year: number;
    }) => {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create budget");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(
        existingBudget
          ? "Budget updated successfully!"
          : "Budget created successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-progress"] });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to save budget. Please try again.");
    },
  });

  const resetForm = () => {
    if (!existingBudget) {
      setCategory("");
      setCategoryIcon("");
      setAmount("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    mutate({
      category,
      categoryIcon,
      amount: amountNum,
      month,
      year,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingBudget ? "Edit Budget" : "Create Budget"}
          </DialogTitle>
          <DialogDescription>
            Set a spending limit for a category this month
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <CategoryPicker
              type="expense"
              onChange={(value) => {
                setCategory(value.name);
                setCategoryIcon(value.icon);
              }}
            />
            {category && (
              <p className="text-sm text-muted-foreground">
                Selected: {categoryIcon} {category}
              </p>
            )}
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
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : existingBudget
                ? "Update Budget"
                : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
