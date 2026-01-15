"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import CategoryPicker from "./CategoryPicker";
import { Category } from "@prisma/client";
import { toast } from "sonner";

interface TransactionSplit {
  category: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

interface SplitTransactionProps {
  totalAmount: number;
  type: "income" | "expense";
  splits: TransactionSplit[];
  onSplitsChange: (splits: TransactionSplit[]) => void;
}

export default function SplitTransaction({
  totalAmount,
  type,
  splits,
  onSplitsChange,
}: SplitTransactionProps) {
  const [showSplits, setShowSplits] = useState(false);

  const addSplit = () => {
    if (splits.length >= 10) {
      toast.error("Maximum 10 splits allowed");
      return;
    }

    const remainingAmount = totalAmount - splits.reduce((sum, s) => sum + s.amount, 0);
    
    onSplitsChange([
      ...splits,
      {
        category: "",
        categoryIcon: "",
        amount: Math.max(0, remainingAmount),
        percentage: 0,
      },
    ]);
  };

  const removeSplit = (index: number) => {
    const updated = splits.filter((_, i) => i !== index);
    onSplitsChange(updated);
    if (updated.length === 0) {
      setShowSplits(false);
    }
  };

  const updateSplit = (index: number, field: keyof TransactionSplit, value: any) => {
    const updated = [...splits];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate percentages
    if (field === "amount" && totalAmount > 0) {
      updated[index].percentage = (value / totalAmount) * 100;
    }

    onSplitsChange(updated);
  };

  const updateCategory = (index: number, category: Category) => {
    const updated = [...splits];
    updated[index] = {
      ...updated[index],
      category: category.name,
      categoryIcon: category.icon,
    };
    onSplitsChange(updated);
  };

  const totalSplitAmount = splits.reduce((sum, s) => sum + s.amount, 0);
  const remaining = totalAmount - totalSplitAmount;
  const isValid = Math.abs(remaining) < 0.01; // Allow small floating point errors

  if (!showSplits) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowSplits(true);
            if (splits.length === 0) {
              addSplit();
            }
          }}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Split Transaction
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label>Split Transaction</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowSplits(false);
            onSplitsChange([]);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {splits.map((split, index) => (
          <div key={index} className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Split #{index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSplit(index)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <CategoryPicker
                  type={type}
                  onChange={(cat) => updateCategory(index, cat)}
                />
                {split.category && (
                  <p className="text-xs text-muted-foreground">
                    {split.categoryIcon} {split.category}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={split.amount}
                  onChange={(e) =>
                    updateSplit(index, "amount", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  {split.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted p-3">
        <div>
          <p className="text-sm font-medium">Total Split</p>
          <p className="text-xs text-muted-foreground">
            {totalSplitAmount.toFixed(2)} / {totalAmount.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${isValid ? "text-emerald-600" : "text-red-600"}`}>
            {isValid ? "✓ Balanced" : `${remaining.toFixed(2)} remaining`}
          </p>
        </div>
      </div>

      {splits.length < 10 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSplit}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Split
        </Button>
      )}

      {!isValid && (
        <p className="text-xs text-red-600">
          Split amounts must equal the total transaction amount
        </p>
      )}
    </div>
  );
}
