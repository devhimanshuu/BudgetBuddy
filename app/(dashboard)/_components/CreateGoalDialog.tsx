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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

interface CreateGoalDialogProps {
  trigger: ReactNode;
}

const GOAL_ICONS = ["🎯", "🏠", "🚗", "✈️", "💰", "🎓", "💍", "🏖️"];
const GOAL_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export default function CreateGoalDialog({ trigger }: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [category, setCategory] = useState("General");
  const [icon, setIcon] = useState(GOAL_ICONS[0]);
  const [color, setColor] = useState(GOAL_COLORS[0]);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create goal");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Goal created successfully!");
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create goal");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setTargetAmount("");
    setTargetDate("");
    setCategory("General");
    setIcon(GOAL_ICONS[0]);
    setColor(GOAL_COLORS[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !targetAmount || !targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid target amount");
      return;
    }

    mutate({
      name,
      description: description || undefined,
      targetAmount: amount,
      targetDate: new Date(targetDate).toISOString(),
      category,
      icon,
      color,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Savings Goal</DialogTitle>
          <DialogDescription>
            Set a new financial goal and track your progress
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Goal Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Vacation Fund, Emergency Savings"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional details about your goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">
                Target Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                placeholder="5000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">
                Target Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Vacation, Emergency, Car"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2">
              {GOAL_ICONS.map((goalIcon) => (
                <button
                  key={goalIcon}
                  type="button"
                  className={`flex h-10 w-10 items-center justify-center rounded-md border-2 text-xl transition-all ${
                    icon === goalIcon
                      ? "scale-110 border-primary"
                      : "border-transparent hover:border-muted-foreground"
                  }`}
                  onClick={() => setIcon(goalIcon)}
                >
                  {goalIcon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {GOAL_COLORS.map((goalColor) => (
                <button
                  key={goalColor}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === goalColor
                      ? "scale-110 border-foreground"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: goalColor }}
                  onClick={() => setColor(goalColor)}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
