
"use client";

import React from "react";
import { PersonaData, PERSONA_THEME } from "@/lib/persona";
import GlassCard from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import {
    Zap,
    AlertTriangle,
    Wallet,
    TrendingDown,
    Target,
    Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PersonaWidgetProps {
    data: PersonaData;
}

export default function PersonaWidget({ data }: PersonaWidgetProps) {
    const config = PERSONA_THEME[data.persona];
    const { setTheme } = useTheme();
    const scoreColor =
        data.healthScore >= 80
            ? "text-emerald-500"
            : data.healthScore >= 50
                ? "text-amber-500"
                : "text-rose-500";

    return (
        <GlassCard className="relative overflow-hidden group">
            <div className="flex flex-col md:flex-row gap-4 p-4 items-stretch">

                {/* Left Column: Icon & Primary Info */}
                <div className="flex-shrink-0 flex md:flex-col items-center gap-3 md:w-40 lg:border-r border-border/50 pr-0 lg:pr-4">
                    <div className="relative">
                        <div
                            className={cn(
                                "flex items-center justify-center h-20 w-20 rounded-2xl shadow-lg transition-transform hover:scale-105 duration-300 bg-gradient-to-br text-4xl select-none",
                                config.gradient
                            )}
                        >
                            {config.icon}
                        </div>
                        {/* Level Badge */}
                        <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-xl">
                            <span className="text-xs font-black text-primary">Lvl {data.level}</span>
                        </div>
                    </div>

                    <div className="text-center md:text-center flex-1 md:flex-none w-full mt-2">
                        <div className="flex flex-col items-center justify-center gap-1 mb-0.5">
                            <h3 className="text-xl font-bold tracking-tight">
                                {data.persona}
                            </h3>
                            <div className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                data.tier === "Bronze" ? "bg-slate-500/10 text-slate-400 border-slate-500/20" :
                                    data.tier === "Silver" ? "bg-amber-600/10 text-amber-600 border-amber-600/20" :
                                        data.tier === "Gold" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                            data.tier === "Platinum" ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" :
                                                "bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse"
                            )}>
                                {data.tier} Tier
                            </div>
                        </div>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", config.color)}>
                            {config.trait}
                        </p>

                        {/* Progress to next level mini bar */}
                        <div className="mt-3 px-2 w-full">
                            <div className="flex justify-between items-center text-[9px] mb-1 font-bold text-muted-foreground uppercase tracking-widest">
                                <span>Exp</span>
                                <span>{data.points} pts</span>
                            </div>
                            <Progress value={data.levelProgress} className="h-1 bg-secondary/50" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Key Metrics & Insights */}
                <div className="flex-1 flex flex-col justify-between gap-3">

                    {/* 1. Header: Health Score & Progress */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Health Score</span>
                            </div>
                            <span className={cn("text-2xl font-bold", scoreColor)}>{data.healthScore}<span className="text-sm text-muted-foreground font-medium">/100</span></span>
                        </div>
                        <Progress
                            value={data.healthScore}
                            className={cn("h-2.5 bg-secondary/50 rounded-full")}
                            indicator={cn(
                                "rounded-full transition-all duration-1000 ease-out",
                                data.healthScore >= 80
                                    ? "bg-emerald-500"
                                    : data.healthScore >= 50
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                            )}
                        />
                    </div>

                    {/* 2. Middle: Key Metrics (Compact) */}
                    <div className="grid grid-cols-3 gap-2 bg-background/40 p-2.5 rounded-xl border border-white/5 shadow-inner">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500 mb-0.5">
                                <Target className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Savings</span>
                            <span className="text-lg font-bold text-foreground">
                                {(data.metrics.savingsRate * 100).toFixed(0)}%
                            </span>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-0.5 border-l border-border/40">
                            <div className="p-1.5 rounded-full bg-rose-500/10 text-rose-500 mb-0.5">
                                <TrendingDown className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Luxury</span>
                            <span className="text-lg font-bold text-foreground">
                                {(data.metrics.luxuryRate * 100).toFixed(0)}%
                            </span>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-0.5 border-l border-border/40">
                            <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500 mb-0.5">
                                <Wallet className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Adherence</span>
                            <span className="text-lg font-bold text-foreground">
                                {(data.metrics.budgetAdherence * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    {/* 3. Bottom: Insights & Unlocks */}
                    <div className="flex flex-col gap-2 mt-auto">
                        {data.level >= 2 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] font-black uppercase tracking-tighter border-primary/20 hover:bg-primary/10 mb-1"
                                onClick={() => {
                                    if (data.level >= 8) {
                                        setTheme("gold-standard");
                                        toast.success("Mythic Reward: Gold Standard Theme applied!", { icon: "👑" });
                                    } else if (data.level >= 5) {
                                        setTheme("cyberpunk");
                                        toast.success("Elite Reward: Cyberpunk Theme applied!", { icon: "🔮" });
                                    } else {
                                        setTheme("midnight");
                                        toast.success("Bronze Reward: Midnight Neon applied!", { icon: "🎨" });
                                    }
                                }}
                            >
                                <Sparkles className="h-3 w-3 mr-1 text-primary" />
                                Claim Available Rewards
                            </Button>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-px flex-1 bg-border/40" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Special Unlocks</span>
                            <div className="h-px flex-1 bg-border/40" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Next Unlock Preview */}
                            {data.nextUnlock && (
                                <div className="flex items-center gap-2 text-[10px] bg-primary/5 p-2 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors group/unlock">
                                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                        <Zap className="h-3 w-3 text-primary group-hover/unlock:animate-pulse" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-primary uppercase tracking-tighter">Lvl {data.nextUnlock.level} Reward</span>
                                        <span className="text-muted-foreground line-clamp-1 font-bold">{data.nextUnlock.name}</span>
                                    </div>
                                </div>
                            )}

                            {/* Insights (only one now to save space) */}
                            {data.insights.slice(0, 1).map((insight, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 text-[10px] text-foreground/90 bg-muted/40 p-2 rounded-lg border border-border/40"
                                >
                                    <div className="h-6 w-6 rounded-md bg-yellow-500/10 flex items-center justify-center shrink-0">
                                        <Target className="h-3 w-3 text-yellow-500" />
                                    </div>
                                    <span className="line-clamp-1 font-medium">{insight}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Blob for aesthetics */}
            <div className={cn(
                "absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10 pointer-events-none",
                config.bg.replace('/10', '/30')
            )} />
        </GlassCard>
    );
}
