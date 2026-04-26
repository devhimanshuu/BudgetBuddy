"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProposeBudget } from "../../_actions/budgets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CategoryPicker from "../../_components/CategoryPicker";
import { Category } from "@prisma/client";

interface Props {
  month: number;
  year: number;
}

export default function ProposeBudgetDialog({ month, year }: Props) {
  const [category, setCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: ProposeBudget,
    onSuccess: () => {
      toast.success("Proposal sent to Admin!");
      queryClient.invalidateQueries({ queryKey: ["budget-proposals"] });
      setOpen(false);
      setCategory(null);
      setAmount(0);
      setNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Propose Amount
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Propose Budget</DialogTitle>
          <DialogDescription>
            Suggest a budget amount for a specific category. Admins will review and finalize the monthly plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <CategoryPicker 
              type="expense" 
              onChange={setCategory} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prop-amount">Suggested Amount</Label>
            <Input
              id="prop-amount"
              type="number"
              placeholder="0.00"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prop-notes">Reason / Notes</Label>
            <Textarea
              id="prop-notes"
              placeholder="Why do we need this amount? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              if (!category || !amount) {
                toast.error("Please select a category and amount");
                return;
              }
              mutate({
                category: category.name,
                categoryIcon: category.icon,
                amount,
                month,
                year,
                notes,
              });
            }}
            disabled={isPending || !category || !amount}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
