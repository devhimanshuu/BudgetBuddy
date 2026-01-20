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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { triggerGoalConfetti } from "@/lib/confetti";
import { UserSettings } from "@prisma/client";
import { GetFormatterForCurrency } from "@/lib/helper";

interface UpdateGoalDialogProps {
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    isCompleted: boolean;
  };
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  userSettings: UserSettings;
}

export default function UpdateGoalDialog({
  goal,
  open,
  onOpenChangeAction,
  userSettings,
}: UpdateGoalDialogProps) {
  const [currentAmount, setCurrentAmount] = useState(
    goal.currentAmount.toString()
  );

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  useEffect(() => {
    setCurrentAmount(goal.currentAmount.toString());
  }, [goal.currentAmount]);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { id: string; currentAmount: number; isCompleted?: boolean }) => {
      const response = await fetch("/api/savings-goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update goal");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Goal updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      onOpenChangeAction(false);
    },
    onError: () => {
      toast.error("Failed to update goal");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(currentAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const isCompleted = amount >= goal.targetAmount;

    // Trigger confetti if goal just completed
    if (isCompleted && !goal.isCompleted) {
      triggerGoalConfetti();
      toast.success("🎉 Congratulations! Goal completed!", {
        duration: 5000,
      });
    }

    mutate({
      id: goal.id,
      currentAmount: amount,
      isCompleted,
    });
  };

  const handleAddAmount = (addAmount: number) => {
    const current = parseFloat(currentAmount) || 0;
    const newAmount = current + addAmount;
    setCurrentAmount(Math.max(0, newAmount).toString());
  };

  const progress = (parseFloat(currentAmount) / goal.targetAmount) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Goal Progress</DialogTitle>
          <DialogDescription>
            Update your savings progress for &quot;{goal.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentAmount">Current Amount</Label>
            <Input
              id="currentAmount"
              type="number"
              step="0.01"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
            />
          </div>

          {/* Quick add buttons */}
          <div className="space-y-2">
            <Label>Quick Add</Label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 50, 100, 500].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddAmount(amount)}
                >
                  +{formatter.format(amount)}
                </Button>
              ))}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="rounded-lg bg-muted p-3">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-semibold">{progress.toFixed(1)}%</span>
            </div>
            {progress >= 100 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                <span>Goal completed! 🎉</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Progress"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
