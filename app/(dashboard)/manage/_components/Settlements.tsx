"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetSettlements, MarkAsPaid } from "../../_actions/settlements";
import { GetWorkspaceMembers, GetActiveWorkspace } from "../../_actions/workspaces";
import { GetFormatterForCurrency } from "@/lib/helper";
import { useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HandCoins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock,
  User,
  Info
} from "lucide-react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  workspaceId: string;
}

export default function Settlements({ workspaceId }: Props) {
  const queryClient = useQueryClient();
  
  const { data: settlements, isLoading } = useQuery({
    queryKey: ["settlements", workspaceId],
    queryFn: () => GetSettlements(),
  });

  const { data: members } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => GetWorkspaceMembers(workspaceId),
  });

  const { data: activeWorkspace } = useQuery({
    queryKey: ["active-workspace"],
    queryFn: () => GetActiveWorkspace(),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(activeWorkspace?.currency || "USD");
  }, [activeWorkspace?.currency]);

  const markPaidMutation = useMutation({
    mutationFn: MarkAsPaid,
    onSuccess: () => {
      toast.success("Settlement updated");
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getMemberName = (userId: string) => {
    const member = members?.find(m => m.userId === userId);
    return member?.name || "Member";
  };

  const getMemberImage = (userId: string) => {
    const member = members?.find(m => m.userId === userId);
    return member?.imageUrl || "";
  };

  const totalOwedToMe = settlements?.owedToMe.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const totalIOwe = settlements?.iOwe.reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <Card className="border-primary/10 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-card to-primary/5 pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary">
              <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span className="truncate">Who Owes Who?</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Track and settle shared expenses within the workspace.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary px-3 py-1 font-bold shrink-0">
            Live Balances
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">
          {/* Owed To Me */}
          <div className="flex flex-col">
            <div className="p-4 bg-emerald-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-emerald-600 dark:text-emerald-400">Owed to You</h3>
              </div>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatter.format(totalOwedToMe)}
              </span>
            </div>
            
            <SkeletonWrapper isLoading={isLoading}>
              <div className="p-2 space-y-2 max-h-[350px] overflow-y-auto">
                {settlements?.owedToMe.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground italic text-sm">
                    Nobody owes you money right now.
                  </div>
                ) : (
                  settlements?.owedToMe.map((s) => (
                    <div key={s.id} className="p-3 rounded-2xl bg-card border border-primary/5 hover:border-primary/20 transition-all group">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-background shadow-sm shrink-0">
                            <AvatarImage src={getMemberImage(s.debtorId)} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {s.debtorName?.slice(0, 2).toUpperCase() || "MB"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{s.debtorName || "Member"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              for {s.transaction.description || s.transaction.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-primary">{formatter.format(s.amount)}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[10px] p-0 text-emerald-500 hover:text-emerald-600 hover:bg-transparent"
                            onClick={() => markPaidMutation.mutate(s.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            Mark as Paid
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SkeletonWrapper>
          </div>

          {/* I Owe */}
          <div className="flex flex-col">
            <div className="p-4 bg-red-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-red-600 dark:text-red-400">You Owe</h3>
              </div>
              <span className="text-lg font-black text-red-600 dark:text-red-400">
                {formatter.format(totalIOwe)}
              </span>
            </div>

            <SkeletonWrapper isLoading={isLoading}>
              <div className="p-2 space-y-2 max-h-[350px] overflow-y-auto">
                {settlements?.iOwe.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground italic text-sm">
                    You don&apos;t owe any money.
                  </div>
                ) : (
                  settlements?.iOwe.map((s) => (
                    <div key={s.id} className="p-3 rounded-2xl bg-card border border-primary/5 hover:border-primary/20 transition-all group">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-background shadow-sm shrink-0">
                            <AvatarImage src={getMemberImage(s.transaction.userId)} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getMemberName(s.transaction.userId).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">Owe {getMemberName(s.transaction.userId)}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              for {s.transaction.description || s.transaction.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-red-500">{formatter.format(s.amount)}</p>
                          <div className="flex items-center gap-1 justify-end text-[10px] text-muted-foreground">
                            <Clock className="w-2 h-2" />
                            Pending
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SkeletonWrapper>
          </div>
        </div>
        
        <div className="p-4 border-t border-border/40 bg-muted/20 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary/60" />
          <p className="text-[10px] text-muted-foreground italic">
            Settlements are tracked automatically when transactions are split between members.
            Only the person who is owed can mark a debt as paid.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
