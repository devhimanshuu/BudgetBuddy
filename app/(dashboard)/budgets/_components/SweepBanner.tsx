"use client";

import { useQuery } from "@tanstack/react-query";
import { UserSettings } from "@prisma/client";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, PartyPopper, ArrowRight, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface SweepBannerProps {
  userSettings: UserSettings;
  month: number;
  year: number;
}

export default function SweepBanner({ userSettings, month, year }: SweepBannerProps) {
  const { isPrivacyMode } = usePrivacyMode();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  // Check if today is near end of month or start of next
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // We only show the banner if we are looking at the current month or previous month
  // and we are within 3 days of the month boundary
  const isRelevantTime = useMemo(() => {
    const today = now.getDate();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Last 3 days of current month
    if (month === currentMonth && year === currentYear && today >= lastDayOfMonth - 2) {
      return true;
    }
    
    // First 3 days of current month (checking previous month's leftovers)
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    if (month === prevMonth && year === prevYear && today <= 3) {
      return true;
    }
    
    return false;
  }, [month, year, currentMonth, currentYear]);

  const { data: budgetProgress, isLoading: isBudgetLoading } = useQuery({
    queryKey: ["budget-progress", month, year],
    queryFn: () =>
      fetch(`/api/budgets/progress?month=${month}&year=${year}`).then((res) =>
        res.json()
      ),
    enabled: isRelevantTime,
  });

  const { data: savingsGoals, isLoading: isGoalsLoading } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: () => fetch("/api/savings-goals").then((res) => res.json()),
    enabled: isOpen,
  });

  const unspentTotal = useMemo(() => {
    if (!budgetProgress) return 0;
    return budgetProgress.reduce((acc: number, b: any) => {
      const remaining = b.budgetAmount - b.spent;
      return acc + (remaining > 0 ? remaining : 0);
    }, 0);
  }, [budgetProgress]);

  const sweepMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const response = await fetch("/api/budgets/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          goalId,
          amount: unspentTotal,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sweep funds");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Funds swept successfully! 🎉");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["budget-progress"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  if (!isRelevantTime || unspentTotal <= 0) return null;

  return (
    <Card className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 mb-6 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <PartyPopper size={80} className="text-emerald-500" />
      </div>
      
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Coins size={24} />
            </div>
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-bold flex items-center justify-center md:justify-start gap-2">
                You saved {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(unspentTotal)} this month! <PartyPopper className="h-5 w-5 text-yellow-500" />
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Great job coming in under budget! Put your leftovers to work and reach your goals faster.
              </p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-8">
                Sweep Leftovers <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Sweep Funds to Savings</DialogTitle>
                <DialogDescription>
                  Move your unspent budget of {formatter.format(unspentTotal)} into a specific savings goal.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select a Savings Goal</label>
                  <Select onValueChange={setSelectedGoalId} value={selectedGoalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a goal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {isGoalsLoading ? (
                        <div className="p-2 space-y-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : savingsGoals?.length > 0 ? (
                        savingsGoals.map((goal: any) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            <span className="flex items-center gap-2">
                              <span>{goal.icon}</span>
                              <span>{goal.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%)
                              </span>
                            </span>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No active savings goals found.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Amount to sweep:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatter.format(unspentTotal)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wallet size={12} />
                    <span>This will be recorded as a savings contribution.</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Maybe Later
                </Button>
                <Button 
                  onClick={() => sweepMutation.mutate(selectedGoalId)}
                  disabled={!selectedGoalId || sweepMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {sweepMutation.isPending ? "Sweeping..." : "Confim Sweep"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
