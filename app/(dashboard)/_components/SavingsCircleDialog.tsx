"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { GetFormatterForCurrency } from "@/lib/helper";
import {
  Trophy,
  Send,
  PlusCircle,
  MessageCircle,
  Users,
  Target,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ContributeToGoal,
  GetGoalSocialData,
  SendGoalMessage,
} from "@/app/(dashboard)/_actions/savings-circles";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { formatDistanceToNow } from "date-fns";

interface SavingsCircleDialogProps {
  goal: {
    id: string;
    name: string;
    icon: string;
    targetAmount: number;
    currentAmount: number;
    currency: string;
    color: string;
  };
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export default function SavingsCircleDialog({
  goal,
  open,
  onOpenChangeAction,
}: SavingsCircleDialogProps) {
  const [contributionAmount, setContributionAmount] = useState<string>("");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(goal.currency);
  }, [goal.currency]);

  const socialQuery = useQuery({
    queryKey: ["goal-social", goal.id],
    queryFn: () => GetGoalSocialData(goal.id),
    enabled: open,
  });

  const contributeMutation = useMutation({
    mutationFn: (amount: number) => ContributeToGoal(goal.id, amount),
    onSuccess: () => {
      toast.success("Contribution recorded! 🎉");
      setContributionAmount("");
      queryClient.invalidateQueries({ queryKey: ["goal-social", goal.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [goal.color, "#ffffff", "#3b82f6"],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to contribute");
    },
  });

  const messageMutation = useMutation({
    mutationFn: (content: string) => SendGoalMessage(goal.id, content),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["goal-social", goal.id] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [socialQuery.data?.messages]);

  const handleContribute = () => {
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) return;
    contributeMutation.mutate(amount);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    messageMutation.mutate(message);
  };

  const progress = (goal.currentAmount / goal.targetAmount) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col bg-background/60 backdrop-blur-2xl border-primary/20">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            background: `radial-gradient(circle at 50% 0%, ${goal.color}, transparent 70%)` 
          }} 
        />
        
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/20"
                style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
              >
                {goal.icon}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  {goal.name}
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                    <Users className="w-3 h-3 mr-1" />
                    Savings Circle
                  </Badge>
                </DialogTitle>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  Target: {formatter.format(goal.targetAmount)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-primary">
                {progress.toFixed(1)}%
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Goal Progress
              </p>
            </div>
          </div>
          <div className="mt-4">
             <Progress 
                value={progress} 
                className="h-3 bg-muted/50 overflow-hidden" 
                style={{ "--progress-foreground": goal.color } as any}
             />
          </div>
        </DialogHeader>

        <Tabs defaultValue="leaderboard" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-muted/30">
            <TabsList className="bg-transparent h-12 gap-6">
              <TabsTrigger 
                value="leaderboard" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full gap-2 px-0"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full gap-2 px-0"
              >
                <MessageCircle className="w-4 h-4" />
                Circle Chat
              </TabsTrigger>
              <TabsTrigger 
                value="contribute" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full gap-2 px-0"
              >
                <PlusCircle className="w-4 h-4" />
                Add Contribution
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="leaderboard" className="flex-1 p-0 m-0 overflow-hidden">
            <ScrollArea className="h-full p-6">
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {socialQuery.data?.leaderboard.map((member, index) => (
                    <motion.div
                      key={member.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={cn(
                        "overflow-hidden transition-all duration-300 hover:scale-[1.02] border-primary/10",
                        index === 0 && "bg-gradient-to-r from-amber-500/10 via-background to-transparent border-amber-500/30",
                        index === 1 && "bg-gradient-to-r from-slate-400/10 via-background to-transparent border-slate-400/30",
                        index === 2 && "bg-gradient-to-r from-orange-600/10 via-background to-transparent border-orange-600/30"
                      )}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarImage src={member.image} />
                                <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              {index < 3 && (
                                <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-lg border">
                                  {index === 0 && <Trophy className="w-4 h-4 text-amber-500" />}
                                  {index === 1 && <Trophy className="w-4 h-4 text-slate-400" />}
                                  {index === 2 && <Trophy className="w-4 h-4 text-orange-600" />}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold">{member.name}</p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                Rank #{index + 1} • Contributor
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-primary">
                              {formatter.format(member.total)}
                            </p>
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="w-3 h-3 text-emerald-500" />
                              <p className="text-[10px] text-emerald-500 font-bold">
                                {((member.total / goal.targetAmount) * 100).toFixed(1)}% OF TOTAL
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {(!socialQuery.data?.leaderboard || socialQuery.data.leaderboard.length === 0) && (
                   <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <Users className="w-12 h-12 mb-4 opacity-20" />
                      <p>No contributions yet. Be the first to start the circle!</p>
                   </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden relative">
              <ScrollArea className="h-full p-6" ref={scrollRef}>
                <div className="space-y-6 pb-4">
                  {socialQuery.data?.messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "flex gap-3 max-w-[80%]",
                        msg.userId === "me" ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <Avatar className="h-8 w-8 mt-1 border">
                        <AvatarImage src={msg.userImage || ""} />
                        <AvatarFallback>{msg.userName?.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 px-1">
                           <span className="text-[10px] font-bold text-muted-foreground">{msg.userName}</span>
                           <span className="text-[8px] text-muted-foreground/60">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                        </div>
                        <div className={cn(
                          "p-3 rounded-2xl text-sm shadow-sm border",
                          "bg-muted/50 backdrop-blur-md border-white/10"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {(!socialQuery.data?.messages || socialQuery.data.messages.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                       <MessageCircle className="w-12 h-12 mb-4" />
                       <p>Start a conversation about this goal!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            <form onSubmit={handleSendMessage} className="p-6 border-t bg-muted/20 backdrop-blur-md">
              <div className="flex gap-2">
                <Input 
                   placeholder="Cheer on the team..." 
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   className="bg-background/80 border-primary/20"
                />
                <Button type="submit" size="icon" disabled={messageMutation.isPending || !message}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="contribute" className="flex-1 p-6 m-0 overflow-hidden">
            <div className="max-w-md mx-auto space-y-8 pt-10">
              <div className="text-center space-y-2">
                 <div className="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-4">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                 </div>
                 <h2 className="text-2xl font-black">Make a Contribution</h2>
                 <p className="text-muted-foreground">Every bit counts towards the {goal.name}!</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                   <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Amount</p>
                   <div className="relative group">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-lg">
                        {goal.currency === "INR" ? "₹" : goal.currency === "USD" ? "$" : ""}
                     </div>
                     <Input 
                       type="number" 
                       placeholder="0.00" 
                       className="pl-10 h-16 text-2xl font-black border-2 border-primary/20 focus-visible:border-primary/50 transition-all"
                       value={contributionAmount}
                       onChange={(e) => setContributionAmount(e.target.value)}
                     />
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                   {[100, 500, 1000].map(amt => (
                      <Button 
                        key={amt} 
                        variant="outline" 
                        className="py-6 hover:bg-primary/10 hover:border-primary/50"
                        onClick={() => setContributionAmount(amt.toString())}
                      >
                        +{amt}
                      </Button>
                   ))}
                </div>

                <Button 
                  className="w-full h-16 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95" 
                  onClick={handleContribute}
                  disabled={contributeMutation.isPending || !contributionAmount}
                >
                  {contributeMutation.isPending ? "Contributing..." : "Contribute Now"}
                </Button>
                
                <p className="text-center text-xs text-muted-foreground">
                   Contributions will be added to the {goal.name} and shared with all circle members.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
