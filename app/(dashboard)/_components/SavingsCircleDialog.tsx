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
import { useUser } from "@clerk/nextjs";
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
  const { user } = useUser();

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
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] sm:h-[85vh] p-0 overflow-hidden flex flex-col bg-background/80 sm:bg-background/60 backdrop-blur-2xl border-primary/20 rounded-2xl sm:rounded-3xl shadow-2xl">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            background: `radial-gradient(circle at 50% 0%, ${goal.color}, transparent 70%)` 
          }} 
        />
        
        <DialogHeader className="p-4 sm:p-6 pb-2 border-b bg-card/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg border border-white/20 shrink-0"
                style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
              >
                {goal.icon}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2">
                  <span className="truncate">{goal.name}</span>
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] sm:text-xs">
                    <Users className="w-3 h-3 mr-1 shrink-0" />
                    Circle
                  </Badge>
                </DialogTitle>
                <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1.5 truncate">
                  <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  Target: {formatter.format(goal.targetAmount)}
                </p>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center justify-between sm:items-end sm:justify-start shrink-0">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-bold order-2 sm:order-1 hidden sm:block">
                Goal Progress
              </p>
              <p className="text-lg sm:text-2xl font-black text-primary order-1 sm:order-2">
                {progress.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
             <Progress 
                value={progress} 
                className="h-2 sm:h-3 bg-muted/50 overflow-hidden" 
                style={{ "--progress-foreground": goal.color } as any}
             />
          </div>
        </DialogHeader>

        <Tabs defaultValue="leaderboard" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-2 sm:px-6 border-b bg-muted/30 overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent h-12 gap-2 sm:gap-6 w-full justify-start min-w-max">
              <TabsTrigger 
                value="leaderboard" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full gap-1.5 sm:gap-2 px-2 sm:px-1 text-xs sm:text-sm"
              >
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full gap-1.5 sm:gap-2 px-2 sm:px-1 text-xs sm:text-sm"
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Circle Chat
              </TabsTrigger>
              <TabsTrigger 
                value="contribute" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full gap-1.5 sm:gap-2 px-2 sm:px-1 text-xs sm:text-sm"
              >
                <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Contribute
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="leaderboard" className="flex-1 p-0 m-0 overflow-hidden bg-card/30">
            <ScrollArea className="h-full p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4 pb-10">
                <AnimatePresence mode="popLayout">
                  {socialQuery.data?.leaderboard.map((member, index) => (
                    <motion.div
                      key={member.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={cn(
                        "overflow-hidden transition-all duration-300 hover:scale-[1.02] border-primary/10 shadow-sm",
                        index === 0 && "bg-gradient-to-r from-amber-500/10 via-background to-transparent border-amber-500/30",
                        index === 1 && "bg-gradient-to-r from-slate-400/10 via-background to-transparent border-slate-400/30",
                        index === 2 && "bg-gradient-to-r from-orange-600/10 via-background to-transparent border-orange-600/30"
                      )}>
                        <CardContent className="p-3 sm:p-4 flex flex-row items-center justify-between gap-2">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="relative shrink-0">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20">
                                <AvatarImage src={member.image} />
                                <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              {index < 3 && (
                                <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-lg border">
                                  {index === 0 && <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />}
                                  {index === 1 && <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />}
                                  {index === 2 && <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm sm:text-base truncate">{member.name}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium truncate">
                                Rank #{index + 1}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg sm:text-xl font-black text-primary">
                              {formatter.format(member.total)}
                            </p>
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="w-3 h-3 text-emerald-500 hidden sm:block" />
                              <p className="text-[9px] sm:text-[10px] text-emerald-500 font-bold">
                                {((member.total / goal.targetAmount) * 100).toFixed(1)}% <span className="hidden sm:inline">OF TOTAL</span>
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

          <TabsContent value="chat" className="flex-1 p-0 m-0 overflow-hidden flex flex-col bg-card/30">
            <div className="flex-1 overflow-hidden relative">
              <ScrollArea className="h-full p-4 sm:p-6" ref={scrollRef}>
                <div className="space-y-4 sm:space-y-6 pb-4">
                  {socialQuery.data?.messages.map((msg, idx) => {
                    const isMe = msg.userId === user?.id; // Check with current user's clerk ID
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[75%]",
                          isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                      >
                        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mt-1 border border-primary/20 shrink-0">
                          <AvatarImage src={msg.userImage || ""} />
                          <AvatarFallback>{msg.userName?.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 min-w-0">
                          <div className={cn(
                            "flex items-center gap-2 px-1",
                            isMe ? "justify-end" : "justify-start"
                          )}>
                             <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground truncate">{isMe ? "You" : msg.userName}</span>
                             <span className="text-[8px] text-muted-foreground/60 shrink-0">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                          </div>
                          <div className={cn(
                            "p-2.5 sm:p-3 rounded-2xl text-[13px] sm:text-sm shadow-sm border break-words",
                            isMe 
                              ? "bg-primary text-primary-foreground border-primary rounded-tr-sm" 
                              : "bg-muted/80 backdrop-blur-md border-border/50 rounded-tl-sm text-foreground"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {(!socialQuery.data?.messages || socialQuery.data.messages.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                       <MessageCircle className="w-12 h-12 mb-4" />
                       <p>Start a conversation about this goal!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            <form onSubmit={handleSendMessage} className="p-3 sm:p-6 border-t bg-muted/20 backdrop-blur-md">
              <div className="flex gap-2 relative">
                <Input 
                   placeholder="Cheer on the team..." 
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   className="bg-background/80 border-primary/20 h-10 sm:h-12 pr-12 rounded-full text-xs sm:text-sm"
                />
                <Button 
                   type="submit" 
                   size="icon" 
                   className="absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                   disabled={messageMutation.isPending || !message}
                >
                  <Send className="w-4 h-4 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="contribute" className="flex-1 p-4 sm:p-6 m-0 overflow-y-auto bg-card/30">
            <div className="max-w-md mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-8 pb-10">
              <div className="text-center space-y-2">
                 <div className="inline-flex p-3 sm:p-4 rounded-3xl bg-primary/10 text-primary mb-2 sm:mb-4 border border-primary/20">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
                 </div>
                 <h2 className="text-xl sm:text-2xl font-black">Make a Contribution</h2>
                 <p className="text-xs sm:text-sm text-muted-foreground">Every bit counts towards the {goal.name}!</p>
              </div>
              
              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                   <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Amount</p>
                   <div className="relative group">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-lg sm:text-xl">
                        {goal.currency === "INR" ? "₹" : goal.currency === "USD" ? "$" : goal.currency === "EUR" ? "€" : "£"}
                     </div>
                     <Input 
                       type="number" 
                       placeholder="0.00" 
                       className="pl-10 h-14 sm:h-16 text-xl sm:text-2xl font-black border-2 border-primary/20 focus-visible:border-primary/50 transition-all rounded-xl"
                       value={contributionAmount}
                       onChange={(e) => setContributionAmount(e.target.value)}
                       autoComplete="off"
                     />
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                   {[100, 500, 1000].map(amt => (
                       <Button 
                         key={amt} 
                         variant="outline" 
                         className="py-5 sm:py-6 hover:bg-primary/10 hover:border-primary/50 rounded-xl"
                         onClick={() => setContributionAmount(amt.toString())}
                       >
                         +{amt}
                       </Button>
                    ))}
                 </div>

                 <Button 
                   className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 rounded-xl" 
                   onClick={handleContribute}
                   disabled={contributeMutation.isPending || !contributionAmount}
                 >
                   {contributeMutation.isPending ? "Contributing..." : "Contribute Now"}
                 </Button>
                 
                 <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-2">
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
