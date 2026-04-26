"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetBudgetProposals, FinalizeBudgetProposal, RejectBudgetProposal } from "../../_actions/budgets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, Check, X, User, MessageSquare } from "lucide-react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  month: number;
  year: number;
}

export default function BudgetProposalsDialog({ month, year }: Props) {
  const queryClient = useQueryClient();
  const { data: proposals, isLoading } = useQuery({
    queryKey: ["budget-proposals", month, year],
    queryFn: () => GetBudgetProposals(month, year),
  });

  const finalizeMutation = useMutation({
    mutationFn: FinalizeBudgetProposal,
    onSuccess: () => {
      toast.success("Budget finalized!");
      queryClient.invalidateQueries({ queryKey: ["budget-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["budget-progress"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: RejectBudgetProposal,
    onSuccess: () => {
      toast.success("Proposal rejected");
      queryClient.invalidateQueries({ queryKey: ["budget-proposals"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pendingProposals = proposals?.filter(p => p.status === "PENDING") || [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <ClipboardList className="mr-2 h-4 w-4" />
          Proposals
          {pendingProposals.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background">
              {pendingProposals.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Budget Proposals</DialogTitle>
          <DialogDescription>
            Review and finalize budget amounts proposed by workspace members.
          </DialogDescription>
        </DialogHeader>

        <SkeletonWrapper isLoading={isLoading}>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            {proposals?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic">
                No budget proposals for this month.
              </div>
            ) : (
              proposals?.map((proposal) => (
                <div
                  key={proposal.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all",
                    proposal.status === "APPROVED" ? "bg-emerald-500/5 border-emerald-500/20" : 
                    proposal.status === "REJECTED" ? "bg-red-500/5 border-red-500/20" : 
                    "bg-card border-primary/10 shadow-sm"
                  )}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl sm:text-2xl shadow-inner">
                        {proposal.categoryIcon}
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg leading-none">{proposal.category}</h3>
                        <p className="text-xl sm:text-2xl font-black text-primary mt-1">
                          ${proposal.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      proposal.status === "APPROVED" ? "default" : 
                      proposal.status === "REJECTED" ? "destructive" : 
                      "secondary"
                    } className="sm:mt-0">
                      {proposal.status}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User className="h-3 w-3 text-primary/60" />
                      {proposal.userName || "Member"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3 text-primary/60" />
                      {proposal.notes || "No notes"}
                    </span>
                  </div>

                  {proposal.status === "PENDING" && (
                    <div className="mt-4 pt-4 border-t border-primary/10 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => finalizeMutation.mutate(proposal.id)}
                        disabled={finalizeMutation.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" /> Finalize
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10"
                        onClick={() => rejectMutation.mutate(proposal.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </SkeletonWrapper>
      </DialogContent>
    </Dialog>
  );
}
